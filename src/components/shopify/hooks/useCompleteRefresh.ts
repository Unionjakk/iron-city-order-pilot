
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { deleteAllOrders } from '../services/cleanupService';
import { importAllOrders, updateLastSyncTime } from '../services/importAllService';

export interface UseCompleteRefreshProps {
  onRefreshComplete: () => Promise<void>;
}

export const useCompleteRefresh = ({ onRefreshComplete }: UseCompleteRefreshProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const { toast } = useToast();

  const addDebugMessage = (message: string) => {
    console.log(`[DEBUG] ${message}`);
    setDebugInfo(prev => [message, ...prev].slice(0, 100)); // Keep last 100 messages
  };

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

  const handleCompleteRefresh = async () => {
    if (isDeleting || isImporting) return; // Prevent multiple clicks

    if (!confirm("WARNING: This will delete ALL existing orders and import only ACTIVE unfulfilled/partially fulfilled orders from Shopify. This operation cannot be undone. Are you sure you want to continue?")) {
      return;
    }

    setError(null);
    setIsDeleting(true);
    setIsSuccess(false);
    setDebugInfo([]);
    
    try {
      addDebugMessage("Starting complete refresh operation");
      
      // Step 1: Delete all orders from the orders table
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
      
      // Step 2: Import active unfulfilled/partially fulfilled orders from Shopify
      setIsDeleting(false);
      setIsImporting(true);
      addDebugMessage("Step 2: Importing ONLY active unfulfilled and partially fulfilled orders from Shopify...");
      
      // Set a 3-minute timeout for the import operation
      const importPromise = importAllOrders(addDebugMessage);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Import operation timed out after 3 minutes")), 180000);
      });
      
      // Use Promise.race to implement a timeout
      const importResult = await Promise.race([importPromise, timeoutPromise]) as any;
      
      // Step 3: Update last sync time
      addDebugMessage("Step 3: Updating last sync time...");
      await updateLastSyncTime(addDebugMessage);
      
      toast({
        title: "Refresh Complete",
        description: `Successfully imported ${importResult.imported || 0} active unfulfilled orders from Shopify`,
        variant: "default",
      });
      
      addDebugMessage("Complete refresh operation finished successfully");
      setIsSuccess(true);
      
      // Refresh the orders list in the parent component
      await onRefreshComplete();
    } catch (error: any) {
      console.error("Error during complete refresh:", error);
      
      // Check for timeout errors specifically
      if (error.message && error.message.includes("timed out")) {
        setError("The import operation timed out. The Shopify API may be slow or there may be too many orders to process at once. You can try 'Enter Recovery Mode' to import the orders without deleting first.");
        addDebugMessage(`ERROR: Import operation timed out`);
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

  const resetState = () => {
    setIsSuccess(false);
    setIsImporting(false);
    setIsDeleting(false);
    setError(null);
  };

  return {
    isDeleting,
    isImporting,
    isSuccess,
    debugInfo,
    error,
    isRecoveryMode,
    handleCompleteRefresh,
    handleRecoveryImport: handleImportOnly,
    addDebugMessage,
    setError,
    setIsRecoveryMode,
    resetState
  };
};
