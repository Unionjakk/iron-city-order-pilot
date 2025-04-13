
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
    onRefreshComplete,
    setIsBackgroundProcessing,
    setOrderCounts
  } = refreshState;

  const checkImportProgress = async (token: string) => {
    try {
      // Poll for import status and order counts
      const response = await supabase.functions.invoke('shopify-complete-refresh', {
        body: { 
          apiToken: token,
          operation: "check_status"
        }
      });
      
      if (response.error) {
        console.error("Error checking import status:", response.error);
        return false;
      }
      
      const data = response.data;
      console.log("Import status check:", data);
      
      if (data?.status === 'idle') {
        addDebugMessage(`[${new Date().toLocaleTimeString()}] Import completed successfully`);
        
        // Update order counts
        if (data.orderCounts) {
          setOrderCounts({
            expected: data.orderCounts.expected || 0,
            imported: data.orderCounts.imported || 0,
            unfulfilled: data.orderCounts.unfulfilled || 0,
            partiallyFulfilled: data.orderCounts.partiallyFulfilled || 0
          });
          
          addDebugMessage(`[${new Date().toLocaleTimeString()}] Final counts - Expected: ${data.orderCounts.expected}, Imported: ${data.orderCounts.imported}, Unfulfilled: ${data.orderCounts.unfulfilled}, Partially Fulfilled: ${data.orderCounts.partiallyFulfilled}`);
          
          // Check if counts match
          if (data.orderCounts.expected !== data.orderCounts.imported) {
            addDebugMessage(`[${new Date().toLocaleTimeString()}] WARNING: Import count mismatch - Expected ${data.orderCounts.expected}, but only imported ${data.orderCounts.imported}`);
          }
        }
        
        return true;
      }
      
      if (data?.status === 'error') {
        addDebugMessage(`[${new Date().toLocaleTimeString()}] Import failed with error: ${data.error || 'Unknown error'}`);
        setError(data.error || 'Unknown error occurred during import');
        return true; // We're done, even though it's an error
      }
      
      return false; // Still in progress
    } catch (error) {
      console.error("Exception checking import status:", error);
      return false;
    }
  };

  const handleCompleteRefresh = async () => {
    if (isDeleting || isImporting) return; // Prevent multiple clicks

    if (!confirm("WARNING: This will delete ALL existing orders and import only ACTIVE unfulfilled/partially fulfilled orders from Shopify. This operation cannot be undone. Are you sure you want to continue?")) {
      return;
    }

    // Clear previous errors and set initial state
    setError(null);
    setIsDeleting(true);
    setIsSuccess(false);
    setOrderCounts({
      expected: 0,
      imported: 0,
      unfulfilled: 0,
      partiallyFulfilled: 0
    });
    
    try {
      addDebugMessage("[" + new Date().toLocaleTimeString() + "] Starting complete refresh operation via the orchestrator function");
      
      // Get API token
      const token = await getTokenFromDatabase();
      
      if (!token) {
        throw new Error("No API token found in database. Please add your Shopify API token first.");
      }
      
      // Add timestamp to each log message for better traceability
      addDebugMessage("[" + new Date().toLocaleTimeString() + "] IMPORTANT: This will ONLY import ACTIVE UNFULFILLED and PARTIALLY FULFILLED orders");
      addDebugMessage("[" + new Date().toLocaleTimeString() + "] Calling shopify-complete-refresh edge function...");
      
      // Set a timeout for the operation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Operation timed out after 90 seconds"));
        }, 90000);
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
      
      // Enhanced error logging for debugging
      console.log("Complete refresh response received:", response);
      
      if (response.error) {
        addDebugMessage(`[${new Date().toLocaleTimeString()}] ERROR: Failed to connect to service: ${response.error.message || 'Unknown error'}`);
        console.error("Edge function error details:", response.error);
        throw new Error(`Failed to connect to service: ${response.error.message || 'Unknown error'}`);
      }
      
      // Obtain response data
      const responseData = response.data;
      
      if (!responseData) {
        addDebugMessage(`[${new Date().toLocaleTimeString()}] ERROR: Empty response received from edge function`);
        throw new Error("Received empty response from server");
      }
      
      // Log all debug messages from the edge function
      if (responseData.debugMessages && Array.isArray(responseData.debugMessages)) {
        responseData.debugMessages.forEach((message: string) => {
          addDebugMessage(`[${new Date().toLocaleTimeString()}] ${message}`);
        });
      }
      
      addDebugMessage(`[${new Date().toLocaleTimeString()}] Response received: status=${response.status}, success=${responseData?.success}, error=${responseData?.error || 'none'}`);
      
      // Log detailed response for debugging
      console.log("Complete refresh response data:", responseData);
      
      if (responseData.error) {
        addDebugMessage(`[${new Date().toLocaleTimeString()}] ERROR: ${responseData.error}`);
        throw new Error(`Operation failed: ${responseData.error}`);
      }
      
      // Handle background processing case
      if (responseData.syncStarted && !responseData.syncComplete) {
        setIsDeleting(false);
        setIsImporting(true);
        setIsBackgroundProcessing(true);
        addDebugMessage(`[${new Date().toLocaleTimeString()}] Deletion completed successfully, but import is taking longer than expected`);
        addDebugMessage(`[${new Date().toLocaleTimeString()}] Import is continuing to run in the background`);
        
        // Store expected counts if available
        if (responseData.orderCounts) {
          setOrderCounts({
            expected: responseData.orderCounts.expected || 0,
            imported: 0, // Will be updated as import progresses
            unfulfilled: responseData.orderCounts.unfulfilled || 0,
            partiallyFulfilled: responseData.orderCounts.partiallyFulfilled || 0
          });
          
          addDebugMessage(`[${new Date().toLocaleTimeString()}] Expected counts - Total: ${responseData.orderCounts.expected}, Unfulfilled: ${responseData.orderCounts.unfulfilled}, Partially Fulfilled: ${responseData.orderCounts.partiallyFulfilled}`);
        }
        
        toast({
          title: "Import Running in Background",
          description: "The deletion completed but the import is taking longer than expected. It's continuing to run in the background.",
          variant: "default",
        });
        
        // Start polling for status until complete
        const pollInterval = setInterval(async () => {
          const isComplete = await checkImportProgress(token);
          if (isComplete) {
            clearInterval(pollInterval);
            setIsImporting(false);
            setIsBackgroundProcessing(false);
            setIsSuccess(true);
            
            toast({
              title: "Refresh Complete",
              description: "Orders import has finished",
              variant: "default",
            });
            
            // Refresh the orders list in the parent component
            await onRefreshComplete();
          }
        }, 5000); // Check every 5 seconds
        
        return;
      }
      
      // Handle success case
      if (responseData.success) {
        setIsSuccess(true);
        
        // Update order counts if available
        if (responseData.orderCounts) {
          setOrderCounts({
            expected: responseData.orderCounts.expected || 0,
            imported: responseData.orderCounts.imported || 0,
            unfulfilled: responseData.orderCounts.unfulfilled || 0,
            partiallyFulfilled: responseData.orderCounts.partiallyFulfilled || 0
          });
        }
        
        addDebugMessage(`[${new Date().toLocaleTimeString()}] SUCCESS: Complete refresh operation finished successfully, imported ${responseData.imported || 0} orders`);
        
        if (responseData.orderCounts) {
          addDebugMessage(`[${new Date().toLocaleTimeString()}] Order counts - Expected: ${responseData.orderCounts.expected}, Imported: ${responseData.orderCounts.imported}, Unfulfilled: ${responseData.orderCounts.unfulfilled}, Partially Fulfilled: ${responseData.orderCounts.partiallyFulfilled}`);
          
          // Check if counts match
          if (responseData.orderCounts.expected !== responseData.orderCounts.imported) {
            addDebugMessage(`[${new Date().toLocaleTimeString()}] WARNING: Import count mismatch - Expected ${responseData.orderCounts.expected}, but only imported ${responseData.orderCounts.imported}`);
          }
        }
        
        toast({
          title: "Refresh Complete",
          description: `Successfully imported ${responseData.imported || 0} active unfulfilled/partially fulfilled orders from Shopify`,
          variant: "default",
        });
        
        // Refresh the orders list in the parent component
        await onRefreshComplete();
      } else {
        // Handle explicit error from the function
        const errorMsg = responseData.error || "Unknown error occurred during refresh operation";
        addDebugMessage(`[${new Date().toLocaleTimeString()}] ERROR: Operation failed: ${errorMsg}`);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error("Error during complete refresh:", error);
      
      // Enhanced error logging
      addDebugMessage(`[${new Date().toLocaleTimeString()}] ERROR DETAILS: ${error.message || "Unknown error"}`);
      if (error.stack) {
        console.error("Error stack:", error.stack);
        addDebugMessage(`[${new Date().toLocaleTimeString()}] Stack trace: ${error.stack.split('\n')[0]}`);
      }
      
      // Check for timeout errors specifically
      if (error.message && error.message.includes("timed out")) {
        setError("The operation timed out. The operation may still be running in the background.");
        addDebugMessage(`[${new Date().toLocaleTimeString()}] ERROR: Operation timed out`);
        setIsBackgroundProcessing(true);
        
        // Start status checking
        const token = await getTokenFromDatabase();
        if (token) {
          const pollInterval = setInterval(async () => {
            const isComplete = await checkImportProgress(token);
            if (isComplete) {
              clearInterval(pollInterval);
              setIsImporting(false);
              setIsBackgroundProcessing(false);
              setIsSuccess(true);
              await onRefreshComplete();
            }
          }, 5000);
        }
      } else {
        setError(error.message || "An unknown error occurred");
        addDebugMessage(`[${new Date().toLocaleTimeString()}] ERROR: ${error.message || "Unknown error"}`);
      }
      
      toast({
        title: "Refresh Failed",
        description: error.message || "Failed to complete the refresh operation",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return { handleCompleteRefresh };
};
