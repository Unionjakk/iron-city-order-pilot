
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getTokenFromDatabase } from '../services/importService';
import { UseRefreshStateReturn } from './types';

export function useCompleteRefreshOperation(refreshState: UseRefreshStateReturn) {
  const [isQueryingSampleOrder, setIsQueryingSampleOrder] = useState<boolean>(false);
  const [sampleOrderData, setSampleOrderData] = useState<any>(null);
  
  const { 
    setIsDeleting, setIsImporting, setDebugInfo, 
    setIsSuccess, setError, setOrderCounts, addDebugMessage,
    setIsBackgroundProcessing, onRefreshComplete, toast
  } = refreshState;
  
  // Handle the complete refresh operation
  const handleCompleteRefresh = async () => {
    try {
      setIsDeleting(true);
      setIsImporting(false);
      setIsSuccess(false);
      setIsBackgroundProcessing(false);
      setError(null);
      setDebugInfo([]);
      
      // Get API token
      addDebugMessage("Getting API token...");
      const apiToken = await getTokenFromDatabase();
      
      if (!apiToken) {
        throw new Error("No API token found in database. Please add your Shopify API token first.");
      }
      
      addDebugMessage("Calling complete refresh function...");
      
      const response = await supabase.functions.invoke('shopify-complete-refresh', {
        body: { 
          apiToken: apiToken,
          debug: true, // Request to include debugging info
          filters: {
            status: "open", 
            fulfillment_status: "unfulfilled,partial"
          }
        }
      });
      
      // Check for errors
      if (response.error) {
        console.error("Error invoking complete refresh function:", response.error);
        addDebugMessage(`Error: ${response.error.message || 'Unknown error'}`);
        throw new Error(response.error.message || 'Error connecting to Shopify API');
      }
      
      const data = response.data as any;
      
      // Check response structure
      if (!data) {
        throw new Error("Invalid response from server");
      }
      
      // Add debug messages to state
      if (data.debugMessages && Array.isArray(data.debugMessages)) {
        data.debugMessages.forEach((msg: string) => addDebugMessage(msg));
      }
      
      // Process response based on status
      if (data.cleaned) {
        addDebugMessage("Database cleaned successfully");
        setIsDeleting(false);
        setIsImporting(true);
      }
      
      if (data.syncComplete) {
        addDebugMessage(`Import completed successfully with ${data.imported || 0} orders imported`);
        setIsImporting(false);
        setIsSuccess(true);
        
        // Store sample order data if provided
        if (data.sampleOrderData) {
          setSampleOrderData(data.sampleOrderData);
          console.log("Sample order data:", data.sampleOrderData);
          addDebugMessage("Sample order data captured for debugging");
        }
        
        // Update order counts with latest data
        if (data.orderCounts) {
          setOrderCounts({
            expected: data.orderCounts.expected || 0,
            imported: data.orderCounts.imported || 0,
            unfulfilled: data.orderCounts.unfulfilled || 0,
            partiallyFulfilled: data.orderCounts.partiallyFulfilled || 0
          });
        }
        
        // Refresh data and display success toast
        await onRefreshComplete();
        
        toast({
          title: "Import Complete",
          description: `Successfully imported ${data.imported || 0} orders.`,
          variant: "default",
        });
      } else if (data.syncStarted && !data.syncComplete) {
        // Handle background processing
        addDebugMessage("Import is running in the background. This may take several minutes.");
        setIsImporting(false);
        setIsSuccess(false);
        setIsBackgroundProcessing(true);
        
        // Store order counts for status display
        if (data.orderCounts) {
          setOrderCounts({
            expected: data.orderCounts.expected || 0,
            imported: 0, // Will be updated through status checks
            unfulfilled: data.orderCounts.unfulfilled || 0,
            partiallyFulfilled: data.orderCounts.partiallyFulfilled || 0
          });
        }
        
        // Start polling for status updates
        pollImportStatus();
      }
      
      // Handle any errors reported
      if (!data.success) {
        const errorMsg = data.error || 'Unknown error occurred during operation';
        setError(errorMsg);
        addDebugMessage(`Error: ${errorMsg}`);
        setIsDeleting(false);
        setIsImporting(false);
        setIsBackgroundProcessing(false);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error("Error during complete refresh:", error);
      setError(error.message || 'Unknown error occurred');
      setIsDeleting(false);
      setIsImporting(false);
      setIsBackgroundProcessing(false);
      
      toast({
        title: "Error",
        description: error.message || 'Unknown error occurred',
        variant: "destructive",
      });
    }
  };
  
  // Function to get sample order data for debugging
  const getSampleOrderData = async () => {
    try {
      setIsQueryingSampleOrder(true);
      
      // Get API token
      const apiToken = await getTokenFromDatabase();
      
      if (!apiToken) {
        throw new Error("No API token found in database");
      }
      
      // Call the status check with debug flag
      const response = await supabase.functions.invoke('shopify-complete-refresh', {
        body: { 
          apiToken: apiToken,
          operation: "check_status",
          debug: true
        }
      });
      
      if (response.error) {
        console.error("Error getting sample data:", response.error);
        return;
      }
      
      const data = response.data as any;
      
      if (data && data.sampleOrderData) {
        setSampleOrderData(data.sampleOrderData);
        console.log("Sample order data:", data.sampleOrderData);
        addDebugMessage("Retrieved sample order data for debugging");
      } else {
        addDebugMessage("No sample order data available");
      }
    } catch (error: any) {
      console.error("Error getting sample order data:", error);
      addDebugMessage(`Error getting sample data: ${error.message}`);
    } finally {
      setIsQueryingSampleOrder(false);
    }
  };
  
  // Poll for import status
  const pollImportStatus = async () => {
    try {
      const apiToken = await getTokenFromDatabase();
      
      if (!apiToken) {
        throw new Error("No API token found");
      }
      
      const pollInterval = setInterval(async () => {
        try {
          // If we're not in background processing state anymore, stop polling
          if (!refreshState.isBackgroundProcessing) {
            clearInterval(pollInterval);
            return;
          }
          
          // Call status check endpoint
          const response = await supabase.functions.invoke('shopify-complete-refresh', {
            body: { 
              apiToken: apiToken,
              operation: "check_status"
            }
          });
          
          if (response.error) {
            console.error("Error checking import status:", response.error);
            return;
          }
          
          const data = response.data as any;
          
          // If status is idle or error, import is done
          if (data.status === 'idle' || data.status === 'error') {
            // Update UI state based on results
            setIsBackgroundProcessing(false);
            
            if (data.status === 'error') {
              setError("Import encountered an error. Check logs for details.");
              addDebugMessage("Import background process failed");
              
              toast({
                title: "Import Error",
                description: "Import encountered an error during background processing.",
                variant: "destructive",
              });
            } else {
              setIsSuccess(true);
              addDebugMessage("Background import completed successfully");
              
              // Update order counts
              if (data.orderCounts) {
                setOrderCounts({
                  expected: refreshState.orderCounts.expected,
                  imported: data.orderCounts.imported || 0,
                  unfulfilled: data.orderCounts.unfulfilled || 0,
                  partiallyFulfilled: data.orderCounts.partiallyFulfilled || 0
                });
              }
              
              // Refresh data
              await onRefreshComplete();
              
              toast({
                title: "Import Complete",
                description: "Background import process completed successfully.",
                variant: "default",
              });
            }
            
            // Stop polling
            clearInterval(pollInterval);
          } else if (data.status === 'background') {
            // Still processing - update counts if available
            if (data.orderCounts) {
              setOrderCounts({
                expected: refreshState.orderCounts.expected,
                imported: data.orderCounts.imported || 0,
                unfulfilled: data.orderCounts.unfulfilled || 0,
                partiallyFulfilled: data.orderCounts.partiallyFulfilled || 0
              });
            }
            
            addDebugMessage(`Status check: Still processing in background. Current count: ${data.orderCounts?.imported || 'unknown'}`);
          }
        } catch (error) {
          console.error("Error in poll loop:", error);
        }
      }, 5000); // Check every 5 seconds
      
      // Cleanup interval on component unmount
      return () => clearInterval(pollInterval);
    } catch (error) {
      console.error("Error setting up polling:", error);
    }
  };
  
  return { 
    handleCompleteRefresh,
    getSampleOrderData,
    isQueryingSampleOrder,
    sampleOrderData
  };
}
