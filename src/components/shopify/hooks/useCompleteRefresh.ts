
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
      
      // Import all orders from Shopify
      addDebugMessage("Importing all orders from Shopify...");
      const importResult = await importAllOrders(addDebugMessage);
      
      // Update last sync time
      addDebugMessage("Updating last sync time...");
      await updateLastSyncTime(addDebugMessage);
      
      toast({
        title: "Recovery Import Complete",
        description: `Successfully imported ${importResult.imported || 0} orders from Shopify`,
        variant: "default",
      });
      
      addDebugMessage("Recovery import operation finished successfully");
      setIsRecoveryMode(false);
      setIsSuccess(true);
      
      // Refresh the orders list in the parent component
      await onRefreshComplete();
    } catch (error: any) {
      console.error("Error during recovery import:", error);
      setError(error.message || "An unknown error occurred during recovery import");
      addDebugMessage(`ERROR: ${error.message || "Unknown error"}`);
      
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

    if (!confirm("WARNING: This will delete ALL existing orders and re-import them from Shopify. This operation cannot be undone. Are you sure you want to continue?")) {
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
      await deleteAllOrders(addDebugMessage);
      
      // Step 2: Import all orders from Shopify
      setIsDeleting(false);
      setIsImporting(true);
      addDebugMessage("Step 2: Importing all orders from Shopify...");
      const importResult = await importAllOrders(addDebugMessage);
      
      // Step 3: Update last sync time
      addDebugMessage("Step 3: Updating last sync time...");
      await updateLastSyncTime(addDebugMessage);
      
      toast({
        title: "Refresh Complete",
        description: `Successfully imported ${importResult.imported || 0} orders from Shopify`,
        variant: "default",
      });
      
      addDebugMessage("Complete refresh operation finished successfully");
      setIsSuccess(true);
      
      // Refresh the orders list in the parent component
      await onRefreshComplete();
    } catch (error: any) {
      console.error("Error during complete refresh:", error);
      setError(error.message || "An unknown error occurred");
      addDebugMessage(`ERROR: ${error.message || "Unknown error"}`);
      
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
