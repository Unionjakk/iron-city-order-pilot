
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
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const addDebugMessage = (message: string) => {
    console.log(`[DEBUG] ${message}`);
    setDebugInfo(prev => [message, ...prev].slice(0, 50)); // Keep last 50 messages
  };

  const handleCompleteRefresh = async () => {
    if (isDeleting || isImporting) return; // Prevent multiple clicks

    if (!confirm("WARNING: This will delete ALL existing orders and re-import them from Shopify. This operation cannot be undone. Are you sure you want to continue?")) {
      return;
    }

    setError(null);
    setIsDeleting(true);
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
      await importAllOrders(addDebugMessage);
      
      // Step 3: Update last sync time
      addDebugMessage("Step 3: Updating last sync time...");
      await updateLastSyncTime(addDebugMessage);
      
      toast({
        title: "Refresh Complete",
        description: "All orders have been refreshed from Shopify",
        variant: "default",
      });
      
      addDebugMessage("Complete refresh operation finished successfully");
      
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

  return {
    isDeleting,
    isImporting,
    debugInfo,
    error,
    handleCompleteRefresh,
    addDebugMessage,
    setError
  };
};
