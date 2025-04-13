
import { UseRefreshStateReturn } from './types';
import { getTokenFromDatabase } from '../services/cleanupService';
import { supabase } from '@/integrations/supabase/client';

export const useCompleteRefreshOperation = (refreshState: UseRefreshStateReturn) => {
  const {
    setIsDeleting,
    setIsImporting,
    isDeleting,
    isImporting,
    setIsSuccess,
    setError,
    addDebugMessage,
    toast,
    onRefreshComplete
  } = refreshState;

  const handleCompleteRefresh = async () => {
    if (isDeleting || isImporting) return; // Prevent multiple clicks

    if (!confirm("WARNING: This will delete ALL existing orders and import only ACTIVE unfulfilled/partially fulfilled orders from Shopify. This operation cannot be undone. Are you sure you want to continue?")) {
      return;
    }

    setError(null);
    setIsDeleting(true);
    setIsSuccess(false);
    
    try {
      addDebugMessage("Starting complete refresh operation via the orchestrator function");
      
      // Get API token
      const token = await getTokenFromDatabase();
      
      if (!token) {
        throw new Error("No API token found in database. Please add your Shopify API token first.");
      }
      
      // Call the complete refresh orchestrator function
      addDebugMessage("Calling shopify-complete-refresh edge function...");
      addDebugMessage("IMPORTANT: This will ONLY import ACTIVE UNFULFILLED and PARTIALLY FULFILLED orders");
      
      // Set a timeout for the operation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Operation timed out after 90 seconds")), 90000);
      });
      
      // Call the orchestrator function
      const apiCallPromise = supabase.functions.invoke('shopify-complete-refresh', {
        body: { 
          apiToken: token,
          filters: {
            status: "open", // Only active orders
            fulfillment_status: "unfulfilled,partial" // Only unfulfilled or partial
          }
        }
      });
      
      // Use Promise.race to implement timeout
      const response = await Promise.race([apiCallPromise, timeoutPromise]) as any;
      
      if (response.error) {
        throw new Error(`Failed to connect to service: ${response.error.message || 'Unknown error'}`);
      }
      
      // Obtain response data
      const responseData = response.data;
      
      // Handle background processing case
      if (responseData.syncStarted && !responseData.syncComplete) {
        setIsDeleting(false);
        setIsImporting(true);
        addDebugMessage("Deletion completed successfully, but import is taking longer than expected");
        addDebugMessage("Import is continuing to run in the background");
        
        toast({
          title: "Import Running in Background",
          description: "The deletion completed but the import is taking longer than expected. It's continuing to run in the background.",
          variant: "default",
        });
        
        return;
      }
      
      // Handle success case
      if (responseData.success) {
        setIsSuccess(true);
        addDebugMessage(`Complete refresh operation finished successfully, imported ${responseData.imported || 0} orders`);
        
        toast({
          title: "Refresh Complete",
          description: `Successfully imported ${responseData.imported || 0} active unfulfilled orders from Shopify`,
          variant: "default",
        });
        
        // Refresh the orders list in the parent component
        await onRefreshComplete();
      } else {
        // Handle explicit error from the function
        throw new Error(responseData.error || "Unknown error occurred during refresh operation");
      }
    } catch (error: any) {
      console.error("Error during complete refresh:", error);
      
      // Check for timeout errors specifically
      if (error.message && error.message.includes("timed out")) {
        setError("The operation timed out. The operation may still be running in the background.");
        addDebugMessage(`ERROR: Operation timed out`);
      } else {
        setError(error.message || "An unknown error occurred");
        addDebugMessage(`ERROR: ${error.message || "Unknown error"}`);
      }
      
      toast({
        title: "Refresh Failed",
        description: error.message || "Failed to complete the refresh operation",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsImporting(false);
    }
  };

  return { handleCompleteRefresh };
};
