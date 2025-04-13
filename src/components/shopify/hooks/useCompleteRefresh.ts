
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRefreshState } from './useRefreshState';
import { useImportOperation } from './useImportOperation';

// Extend interface for refresh state props
export interface UseCompleteRefreshProps {
  onRefreshComplete: () => Promise<void>;
}

// Main hook for complete refresh management
export const useCompleteRefresh = ({ onRefreshComplete }: UseCompleteRefreshProps) => {
  // Base refresh state
  const refreshState = useRefreshState({ onRefreshComplete });
  const { handleImportOnly, isBackgroundProcessing } = useImportOperation(refreshState);
  
  // Add new states for order count tracking and verification
  const [expectedOrderCount, setExpectedOrderCount] = useState<number | undefined>(undefined);
  const [actualOrderCount, setActualOrderCount] = useState<number | undefined>(undefined);
  const [unfulfilledCount, setUnfulfilledCount] = useState<number | undefined>(undefined);
  const [partialFulfilledCount, setPartialFulfilledCount] = useState<number | undefined>(undefined);
  const [isDataMismatch, setIsDataMismatch] = useState(false);
  const [lastVerificationTime, setLastVerificationTime] = useState<Date | null>(null);

  const {
    isDeleting,
    isImporting,
    isSuccess,
    setIsSuccess,
    debugInfo,
    error,
    addDebugMessage,
    resetState,
    toast
  } = refreshState;

  // Get the expected order count from Shopify before starting import
  const getExpectedOrderCount = useCallback(async () => {
    try {
      addDebugMessage("Checking Shopify for expected order counts...");
      
      // Get API token from database
      const { data: tokenData, error: tokenError } = await supabase.rpc("get_shopify_setting", { 
        setting_name_param: 'shopify_token' 
      });
      
      if (tokenError || !tokenData) {
        addDebugMessage(`Failed to retrieve API token: ${tokenError?.message || 'No token found'}`);
        return null;
      }
      
      // Get API endpoint from database
      const { data: endpointData, error: endpointError } = await supabase.rpc("get_shopify_setting", { 
        setting_name_param: 'shopify_api_endpoint' 
      });
      
      if (endpointError || !endpointData) {
        addDebugMessage(`Failed to retrieve API endpoint: ${endpointError?.message || 'No endpoint found'}`);
        return null;
      }
      
      // Call edge function to get counts
      const response = await supabase.functions.invoke('shopify-get-counts', {
        body: { 
          apiToken: tokenData,
          apiEndpoint: endpointData
        }
      });
      
      if (response.error) {
        addDebugMessage(`Error checking order counts: ${response.error.message}`);
        return null;
      }
      
      const countData = response.data;
      if (!countData || !countData.success) {
        addDebugMessage(`Failed to get order counts: ${countData?.error || 'Unknown error'}`);
        return null;
      }
      
      addDebugMessage(`Expected unfulfilled orders: ${countData.unfulfilled}`);
      addDebugMessage(`Expected partially fulfilled orders: ${countData.partialFulfilled}`);
      addDebugMessage(`Expected total active orders: ${countData.total}`);
      
      return {
        unfulfilled: countData.unfulfilled || 0,
        partialFulfilled: countData.partialFulfilled || 0,
        total: countData.total || 0
      };
    } catch (error: any) {
      addDebugMessage(`Exception checking order counts: ${error.message}`);
      return null;
    }
  }, [addDebugMessage, supabase]);

  // Verify the import completion by checking database counts
  const verifyImportCompletion = useCallback(async () => {
    try {
      // Don't verify too frequently
      const now = new Date();
      if (lastVerificationTime && (now.getTime() - lastVerificationTime.getTime() < 5000)) {
        return;
      }
      setLastVerificationTime(now);
      
      addDebugMessage(`Verifying import completion at ${now.toISOString()}`);
      
      // Check current count of orders in database
      const { count: orderCount, error: orderError } = await supabase
        .from('shopify_orders')
        .select('*', { count: 'exact', head: true });
      
      if (orderError) {
        addDebugMessage(`Error checking order count: ${orderError.message}`);
        return;
      }
      
      // Check count of unfulfilled orders
      const { count: unfulfilledOrderCount, error: unfulfilledError } = await supabase
        .from('shopify_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'unfulfilled');
      
      if (unfulfilledError) {
        addDebugMessage(`Error checking unfulfilled order count: ${unfulfilledError.message}`);
        return;
      }
      
      // Check count of partially fulfilled orders
      const { count: partialOrderCount, error: partialError } = await supabase
        .from('shopify_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'partially_fulfilled');
      
      if (partialError) {
        addDebugMessage(`Error checking partially fulfilled order count: ${partialError.message}`);
        return;
      }
      
      // Check count of order items
      const { count: orderItemsCount, error: itemsError } = await supabase
        .from('shopify_order_items')
        .select('*', { count: 'exact', head: true });
      
      if (itemsError) {
        addDebugMessage(`Error checking order items count: ${itemsError.message}`);
        return;
      }
      
      // Update state with actual counts
      setActualOrderCount(orderCount || 0);
      setUnfulfilledCount(unfulfilledOrderCount || 0);
      setPartialFulfilledCount(partialOrderCount || 0);
      
      addDebugMessage(`Current database counts - Orders: ${orderCount}, Unfulfilled: ${unfulfilledOrderCount}, Partial: ${partialOrderCount}, Items: ${orderItemsCount}`);
      
      // Check if the counts match expected counts
      if (expectedOrderCount !== undefined) {
        const hasMismatch = orderCount !== expectedOrderCount;
        setIsDataMismatch(hasMismatch);
        
        if (hasMismatch) {
          addDebugMessage(`DATA MISMATCH: Expected ${expectedOrderCount} orders but found ${orderCount}`);
          
          // Check import status from database
          const { data: statusData } = await supabase.rpc("get_shopify_setting", { 
            setting_name_param: 'shopify_import_status' 
          });
          
          if (statusData === 'idle') {
            addDebugMessage('Import status is idle but counts don\'t match. Import may have completed with errors.');
            
            // If background processing is done but we still have mismatch, mark as success but with mismatch flag
            if (isBackgroundProcessing) {
              addDebugMessage('Background process appears to be complete but with data mismatch.');
              setIsSuccess(true);
            }
          } else if (statusData === 'importing' || statusData === 'background') {
            addDebugMessage(`Import still in progress (status: ${statusData}). Will continue monitoring.`);
          } else {
            addDebugMessage(`Import status is ${statusData || 'unknown'}`);
          }
        } else {
          // If the counts match, consider the import successful
          addDebugMessage('DATA VERIFIED: Database counts match expected counts');
          
          if (isBackgroundProcessing) {
            addDebugMessage('Background process appears to be complete with accurate data.');
            setIsSuccess(true);
            
            // Notify user of successful completion
            toast({
              title: "Import Complete",
              description: `Successfully imported ${orderCount} orders (${unfulfilledOrderCount} unfulfilled, ${partialOrderCount} partial)`,
              variant: "default",
            });
          }
        }
      }
      
      return {
        orderCount,
        unfulfilledOrderCount,
        partialOrderCount,
        orderItemsCount
      };
    } catch (error: any) {
      addDebugMessage(`Exception verifying import: ${error.message}`);
      return null;
    }
  }, [addDebugMessage, expectedOrderCount, isBackgroundProcessing, lastVerificationTime, setIsSuccess, supabase, toast]);

  // Complete refresh handler
  const handleCompleteRefresh = async () => {
    if (isDeleting || isImporting) return; // Prevent multiple clicks
    
    // Clear previous state
    resetState();
    setExpectedOrderCount(undefined);
    setActualOrderCount(undefined);
    setUnfulfilledCount(undefined);
    setPartialFulfilledCount(undefined);
    setIsDataMismatch(false);
    
    try {
      // Step 1: Get expected order counts from Shopify
      const counts = await getExpectedOrderCount();
      if (counts) {
        setExpectedOrderCount(counts.total);
        setUnfulfilledCount(counts.unfulfilled);
        setPartialFulfilledCount(counts.partialFulfilled);
        addDebugMessage(`Expected to import ${counts.total} orders (${counts.unfulfilled} unfulfilled, ${counts.partialFulfilled} partial)`);
      } else {
        addDebugMessage("Could not determine expected order counts, will continue without verification");
      }
      
      // Step 2: Proceed with import operation
      await handleImportOnly();
      
      // Step 3: Verify import completion
      const verificationResult = await verifyImportCompletion();
      if (verificationResult) {
        addDebugMessage(`Initial verification complete. Found ${verificationResult.orderCount} orders with ${verificationResult.orderItemsCount} line items`);
      }
    } catch (error: any) {
      console.error("Error during complete refresh:", error);
    }
  };

  return {
    ...refreshState,
    isBackgroundProcessing,
    expectedOrderCount,
    actualOrderCount,
    unfulfilledCount,
    partialFulfilledCount,
    isDataMismatch,
    handleCompleteRefresh,
    verifyImportCompletion
  };
};
