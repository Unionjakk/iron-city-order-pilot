
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useRefreshState, OrderCounts } from './useRefreshState';

interface UseCompleteRefreshProps {
  onRefreshComplete: () => Promise<void>;
}

export const useCompleteRefresh = ({ onRefreshComplete }: UseCompleteRefreshProps) => {
  const refreshState = useRefreshState({ onRefreshComplete });
  const [isPolling, setIsPolling] = useState(false);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  const {
    isDeleting,
    setIsDeleting,
    isImporting,
    setIsImporting,
    isSuccess,
    setIsSuccess,
    isBackgroundProcessing,
    setIsBackgroundProcessing,
    debugInfo,
    setDebugInfo,
    error,
    setError,
    orderCounts,
    setOrderCounts,
    addDebugMessage,
    resetState,
    toast,
  } = refreshState;

  // Function to get import status from database
  const checkImportStatus = useCallback(async () => {
    try {
      // Check current import status
      const { data: statusData, error: statusError } = await supabase.rpc('get_shopify_setting', {
        setting_name_param: 'shopify_import_status'
      });

      if (statusError) {
        console.error('Error checking import status:', statusError);
        return;
      }

      // Check current order counts in database
      const { data: ordersCountData } = await supabase.rpc('get_shopify_setting', {
        setting_name_param: 'shopify_orders_count'
      });

      const { data: itemsCountData } = await supabase.rpc('get_shopify_setting', {
        setting_name_param: 'shopify_order_items_count'
      });

      // Update state based on current status
      if (statusData === 'importing') {
        setIsImporting(true);
        setIsBackgroundProcessing(false);
      } else if (statusData === 'background') {
        setIsImporting(false);
        setIsBackgroundProcessing(true);
      } else if (statusData === 'idle') {
        setIsImporting(false);
        setIsBackgroundProcessing(false);
        setIsSuccess(true);
        
        // Update order counts with actual database counts
        setOrderCounts(prev => ({
          ...prev,
          imported: parseInt(ordersCountData || '0', 10)
        }));
        
        // Stop polling when complete
        if (isPolling) {
          setIsPolling(false);
          addDebugMessage("Import completed successfully - stopping status polling");
          
          // Refresh data
          await onRefreshComplete();
          
          toast({
            title: "Import Completed",
            description: `Successfully imported ${parseInt(ordersCountData || '0', 10)} orders with ${parseInt(itemsCountData || '0', 10)} line items`,
          });
        }
      } else if (statusData === 'error') {
        setIsImporting(false);
        setIsBackgroundProcessing(false);
        setError("Import failed - check logs for details");
        
        // Stop polling on error
        if (isPolling) {
          setIsPolling(false);
          addDebugMessage("Import failed - stopping status polling");
          
          toast({
            title: "Import Failed",
            description: "There was an error during the import process",
            variant: "destructive"
          });
        }
      }
    } catch (err: any) {
      console.error('Error in checkImportStatus:', err);
      addDebugMessage(`Error checking status: ${err.message}`);
    }
  }, [
    isPolling, 
    setIsImporting, 
    setIsBackgroundProcessing, 
    setIsSuccess, 
    setOrderCounts, 
    setError, 
    addDebugMessage, 
    onRefreshComplete, 
    toast
  ]);

  // Set up polling for import status
  useEffect(() => {
    if (isPolling && !pollInterval) {
      // Poll every 2 seconds
      const interval = setInterval(checkImportStatus, 2000);
      setPollInterval(interval);
      addDebugMessage("Started polling for import status");
    } else if (!isPolling && pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
      addDebugMessage("Stopped polling for import status");
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isPolling, pollInterval, checkImportStatus, addDebugMessage]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  // Handle the complete refresh operation
  const handleCompleteRefresh = async () => {
    // Don't allow starting if already in progress
    if (isDeleting || isImporting || isBackgroundProcessing) {
      return;
    }

    try {
      resetState();
      addDebugMessage("Starting complete refresh operation");
      
      // Step 1: Get the Shopify API token
      addDebugMessage("Getting API token from database...");
      const { data: token, error: tokenError } = await supabase.rpc('get_shopify_setting', {
        setting_name_param: 'shopify_token'
      });
      
      if (tokenError || !token) {
        throw new Error(`Failed to get API token: ${tokenError?.message || 'Token not found'}`);
      }
      
      // Step 2: Perform cleanup operation first
      setIsDeleting(true);
      addDebugMessage("Starting database cleanup...");
      
      const cleanupResponse = await supabase.functions.invoke('shopify-database-cleanup', {
        body: { apiToken: token }
      });
      
      if (cleanupResponse.error) {
        throw new Error(`Cleanup operation failed: ${cleanupResponse.error.message}`);
      }
      
      const cleanupData = cleanupResponse.data as any;
      
      if (!cleanupData?.success) {
        throw new Error(`Cleanup operation failed: ${cleanupData?.error || 'Unknown error'}`);
      }
      
      addDebugMessage("Database cleanup completed successfully");
      setIsDeleting(false);
      
      // Step 3: Start import operation
      setIsImporting(true);
      addDebugMessage("Starting import operation...");
      
      // First get the expected count of orders to import
      try {
        const countResponse = await supabase.functions.invoke('shopify-complete-refresh', {
          body: { 
            apiToken: token, 
            operation: 'check_status'
          }
        });
        
        if (countResponse.data?.orderCounts) {
          const counts = countResponse.data.orderCounts;
          setOrderCounts({
            expected: counts.expected || 0,
            unfulfilled: counts.unfulfilled || 0,
            partiallyFulfilled: counts.partiallyFulfilled || 0,
            imported: 0
          });
          addDebugMessage(`Expected to import: ${counts.expected} orders (${counts.unfulfilled} unfulfilled, ${counts.partiallyFulfilled} partially fulfilled)`);
        }
      } catch (countError) {
        console.error('Error getting order counts:', countError);
        addDebugMessage(`Warning: Failed to get expected order counts: ${countError.message}`);
      }
      
      // Start the import with progress tracking
      try {
        const importResponse = await supabase.functions.invoke('shopify-complete-refresh', {
          body: { 
            apiToken: token,
            trackProgress: true
          }
        });
        
        if (importResponse.error) {
          throw new Error(`Import operation failed: ${importResponse.error.message}`);
        }
        
        const importData = importResponse.data as any;
        
        // Handle the response - check if the operation is running in the background
        if (importData.syncStarted && !importData.syncComplete) {
          addDebugMessage("Import operation started but running in background");
          setIsImporting(false);
          setIsBackgroundProcessing(true);
          
          // Start polling for status updates
          setIsPolling(true);
        } else if (importData.success) {
          addDebugMessage(`Import completed successfully with ${importData.imported || 0} orders imported`);
          setIsImporting(false);
          setIsSuccess(true);
          
          // Update order counts with actual imported count
          setOrderCounts(prev => ({
            ...prev,
            imported: importData.imported || 0
          }));
          
          // Refresh data
          await onRefreshComplete();
          
          toast({
            title: "Import Completed",
            description: `Successfully imported ${importData.imported || 0} orders`,
          });
        } else {
          throw new Error(`Import failed: ${importData.error || 'Unknown error'}`);
        }
      } catch (importError: any) {
        console.error('Import operation error:', importError);
        addDebugMessage(`Error during import: ${importError.message}`);
        setIsImporting(false);
        setError(importError.message);
        
        toast({
          title: "Import Failed",
          description: importError.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Complete refresh error:', error);
      addDebugMessage(`Error: ${error.message}`);
      setIsDeleting(false);
      setIsImporting(false);
      setError(error.message);
      
      toast({
        title: "Operation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return {
    isDeleting,
    isImporting,
    isSuccess,
    isBackgroundProcessing,
    debugInfo,
    error,
    orderCounts,
    handleCompleteRefresh,
    resetState
  };
};
