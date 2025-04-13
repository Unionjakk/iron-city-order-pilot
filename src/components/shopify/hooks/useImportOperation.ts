
import { UseRefreshStateReturn } from './types';
import { importAllOrders, updateLastSyncTime } from '../services/importAllService';

export const useImportOperation = (refreshState: UseRefreshStateReturn) => {
  const {
    setIsImporting,
    setIsSuccess,
    setError,
    setIsRecoveryMode,
    addDebugMessage,
    toast,
    onRefreshComplete
  } = refreshState;

  const handleImportOnly = async () => {
    setIsImporting(true);
    setIsSuccess(false);
    setError(null);
    
    try {
      addDebugMessage("Starting import-only operation (recovery mode)");
      
      // Import active unfulfilled/partially fulfilled orders from Shopify
      addDebugMessage("Importing ONLY active unfulfilled and partially fulfilled orders from Shopify...");
      
      // Set a longer timeout for recovery mode imports (5 minutes)
      const importPromise = importAllOrders(addDebugMessage);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Import operation timed out after 5 minutes")), 300000);
      });
      
      // Use Promise.race to implement a timeout
      const importResult = await Promise.race([importPromise, timeoutPromise]) as any;
      
      // Update last sync time
      addDebugMessage("Updating last sync time...");
      await updateLastSyncTime(addDebugMessage);
      
      toast({
        title: "Recovery Import Complete",
        description: `Successfully imported ${importResult.imported || 0} active unfulfilled orders from Shopify`,
        variant: "default",
      });
      
      addDebugMessage("Recovery import operation finished successfully");
      setIsRecoveryMode(false);
      setIsSuccess(true);
      
      // Refresh the orders list in the parent component
      await onRefreshComplete();
    } catch (error: any) {
      console.error("Error during recovery import:", error);
      
      // Check for timeout errors specifically
      if (error.message && error.message.includes("timed out")) {
        setError("The import operation timed out. The Shopify API may be slow or there may be too many orders to process at once. Please try again later or contact support.");
        addDebugMessage(`ERROR: Import operation timed out`);
      } else {
        setError(error.message || "An unknown error occurred during recovery import");
        addDebugMessage(`ERROR: ${error.message || "Unknown error"}`);
      }
      
      toast({
        title: "Recovery Import Failed",
        description: error.message || "Failed to complete the recovery import operation",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return { handleImportOnly };
};
