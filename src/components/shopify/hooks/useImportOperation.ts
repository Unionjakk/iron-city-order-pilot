
import { UseRefreshStateReturn } from './types';
import { importAllOrders, updateLastSyncTime } from '../services/importAllService';
import { deleteAllOrders } from '../services/cleanupService';

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

  const handleImportOnly = async () => {
    // Always force deletion first, even in recovery mode
    setIsDeleting(true);
    setIsImporting(false);
    setIsSuccess(false);
    setError(null);
    
    try {
      addDebugMessage("Starting import operation with required deletion first");
      
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
      addDebugMessage("Step 2: Importing ONLY active unfulfilled and partially fulfilled orders from Shopify...");
      
      // Set a timeout for the import operation
      const importPromise = importAllOrders(addDebugMessage);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Import operation timed out after 5 minutes")), 300000);
      });
      
      // Use Promise.race to implement a timeout
      const importResult = await Promise.race([importPromise, timeoutPromise]) as any;
      
      // Step 3: Update last sync time
      addDebugMessage("Step 3: Updating last sync time...");
      await updateLastSyncTime(addDebugMessage);
      
      toast({
        title: "Import Complete",
        description: `Successfully imported ${importResult.imported || 0} active unfulfilled orders from Shopify`,
        variant: "default",
      });
      
      addDebugMessage("Import operation finished successfully");
      setIsSuccess(true);
      
      // Refresh the orders list in the parent component
      await onRefreshComplete();
    } catch (error: any) {
      console.error("Error during import operation:", error);
      
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
    } finally {
      setIsDeleting(false);
      setIsImporting(false);
    }
  };

  return { handleImportOnly };
};
