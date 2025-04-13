
import { UseRefreshStateReturn } from './types';
import { importAllOrders, updateLastSyncTime } from '../services/importAllService';
import { deleteAllOrders } from '../services/cleanupService';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

export const useImportOperation = (refreshState: UseRefreshStateReturn) => {
  const {
    setIsDeleting,
    setIsImporting,
    setIsSuccess,
    setError,
    addDebugMessage,
    toast,
    onRefreshComplete
  } = refreshState;
  
  // Add state to track background processing
  const [isBackgroundProcessing, setIsBackgroundProcessing] = useState(false);
  const [backgroundStatusPolling, setBackgroundStatusPolling] = useState<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (backgroundStatusPolling) {
        clearInterval(backgroundStatusPolling);
      }
    };
  }, [backgroundStatusPolling]);

  // Function to check import status from database
  const checkImportStatus = async () => {
    try {
      const { data: statusData, error: statusError } = await supabase.rpc("get_shopify_setting", { 
        setting_name_param: 'shopify_import_status' 
      });
      
      if (statusError) {
        console.error('Error checking import status:', statusError);
        return null;
      }
      
      return statusData;
    } catch (error) {
      console.error('Exception checking import status:', error);
      return null;
    }
  };

  // Function to start polling for import status
  const startStatusPolling = () => {
    if (backgroundStatusPolling) {
      clearInterval(backgroundStatusPolling);
    }
    
    // Poll every 10 seconds
    const intervalId = setInterval(async () => {
      const status = await checkImportStatus();
      
      // If status is idle, operation completed in the background
      if (status === 'idle') {
        setIsBackgroundProcessing(false);
        setIsImporting(false);
        setIsSuccess(true);
        setError(null);
        clearInterval(intervalId);
        setBackgroundStatusPolling(null);
        
        // Refresh orders list
        await onRefreshComplete();
        
        toast({
          title: "Background Import Complete",
          description: "The import operation has finished successfully in the background.",
          variant: "default",
        });
        
        addDebugMessage("Background import operation completed successfully");
      } 
      // If status is error, operation failed in the background
      else if (status === 'error') {
        setIsBackgroundProcessing(false);
        setIsImporting(false);
        setIsSuccess(false);
        setError("The import operation failed in the background. Check logs for details.");
        clearInterval(intervalId);
        setBackgroundStatusPolling(null);
        
        toast({
          title: "Background Import Failed",
          description: "The import operation failed in the background. Please try again.",
          variant: "destructive",
        });
        
        addDebugMessage("Background import operation failed");
      }
    }, 10000);
    
    setBackgroundStatusPolling(intervalId);
  };

  // Set initial import status in database
  const setImportStatus = async (status: string) => {
    try {
      const { error } = await supabase.rpc("upsert_shopify_setting", {
        setting_name_param: "shopify_import_status",
        setting_value_param: status
      });
      
      if (error) {
        console.error('Error setting import status:', error);
      }
    } catch (error) {
      console.error('Exception setting import status:', error);
    }
  };

  const handleImportOnly = async () => {
    // If already in background processing mode, don't start new import
    if (isBackgroundProcessing) {
      toast({
        title: "Import In Progress",
        description: "An import operation is already running in the background. Please wait for it to complete.",
        variant: "warning",
      });
      return;
    }
    
    // Set UI state
    setIsDeleting(true);
    setIsImporting(false);
    setIsSuccess(false);
    setError(null);
    
    try {
      addDebugMessage("Starting import operation with required deletion first");
      
      // Set database status to deleting
      await setImportStatus('deleting');
      
      // Step 1: Always delete existing data first
      addDebugMessage("Step 1: Deleting all existing orders...");
      
      let retries = 0;
      const maxRetries = 3;
      let deleteSuccess = false;
      
      while (!deleteSuccess && retries < maxRetries) {
        try {
          addDebugMessage(`Deletion attempt ${retries + 1} of ${maxRetries}...`);
          await deleteAllOrders(addDebugMessage);
          deleteSuccess = true;
          addDebugMessage("Deletion completed successfully!");
          break;
        } catch (deleteError: any) {
          addDebugMessage(`Error during deletion attempt ${retries + 1}: ${deleteError.message}`);
          
          if (retries >= maxRetries - 1) {
            // Update status in database
            await setImportStatus('error');
            throw deleteError; // Re-throw on last attempt
          }
          
          // Add backoff before retry
          const backoffMs = 2000 * Math.pow(2, retries);
          addDebugMessage(`Waiting ${backoffMs/1000} seconds before retry...`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          retries++;
        }
      }
      
      // Step 2: Import orders from Shopify
      setIsDeleting(false);
      setIsImporting(true);
      
      // Update database status to importing
      await setImportStatus('importing');
      
      addDebugMessage("Step 2: Importing ONLY active unfulfilled and partially fulfilled orders from Shopify...");
      
      // Set a timeout for the import operation
      const importPromise = importAllOrders(addDebugMessage);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Import operation timed out after 5 minutes")), 300000);
      });
      
      try {
        // Use Promise.race to implement a timeout
        const importResult = await Promise.race([importPromise, timeoutPromise]) as any;
        
        // Step 3: Update last sync time
        addDebugMessage("Step 3: Updating last sync time...");
        await updateLastSyncTime(addDebugMessage);
        
        // Update database status to idle
        await setImportStatus('idle');
        
        toast({
          title: "Import Complete",
          description: `Successfully imported ${importResult.imported || 0} active unfulfilled orders from Shopify`,
          variant: "default",
        });
        
        addDebugMessage("Import operation finished successfully");
        setIsSuccess(true);
        
        // Refresh the orders list in the parent component
        await onRefreshComplete();
      } catch (timeoutError: any) {
        // If the operation timed out, it's likely still running in the background
        if (timeoutError.message && timeoutError.message.includes("timed out")) {
          setIsBackgroundProcessing(true);
          addDebugMessage("Import operation timed out but is continuing in the background");
          
          // Start polling for completion status
          startStatusPolling();
          
          toast({
            title: "Import Processing in Background",
            description: "The import is taking longer than expected and will continue processing in the background. You can check status later.",
            variant: "warning",
          });
          
          // Don't mark as error, since it's still processing
          setError(null);
        } else {
          // For other errors, handle normally
          await setImportStatus('error');
          throw timeoutError;
        }
      }
    } catch (error: any) {
      console.error("Error during import operation:", error);
      
      // Update database status to error unless it's a timeout (handled above)
      if (!isBackgroundProcessing) {
        await setImportStatus('error');
        
        // Check for timeout errors specifically
        if (error.message && error.message.includes("timed out")) {
          setError("The import operation timed out. The Shopify API may be slow or there may be too many orders to process at once. Please try again later or contact support.");
          addDebugMessage(`ERROR: Import operation timed out`);
        } else {
          setError(error.message || "An unknown error occurred during import");
          addDebugMessage(`ERROR: ${error.message || "Unknown error"}`);
        }
        
        toast({
          title: "Import Failed",
          description: error.message || "Failed to complete the import operation",
          variant: "destructive",
        });
      }
    } finally {
      // Only reset UI state if not in background processing mode
      if (!isBackgroundProcessing) {
        setIsDeleting(false);
        setIsImporting(false);
      }
    }
  };

  return { 
    handleImportOnly,
    isBackgroundProcessing
  };
};
