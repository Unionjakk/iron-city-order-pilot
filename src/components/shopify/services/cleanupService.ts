
import { supabase } from '@/integrations/supabase/client';

/**
 * Delete all orders and order items via the edge function
 */
export const deleteAllOrders = async (addDebugMessage: (message: string) => void) => {
  try {
    addDebugMessage("Starting deletion of all order data via edge function...");
    
    // Get API token (needed for the edge function)
    const token = await getTokenFromDatabase();
    
    if (!token) {
      throw new Error("No API token found in database. Please add your Shopify API token first.");
    }
    
    // Call the edge function with clean operation
    addDebugMessage("Calling shopify-sync-all edge function for database cleaning...");
    const response = await supabase.functions.invoke('shopify-sync-all', {
      body: { 
        apiToken: token,
        operation: "clean" // Special operation to clean the database
      }
    });

    // Check for invocation error
    if (response.error) {
      console.error('Error invoking edge function for deletion:', response.error);
      throw new Error(`Failed to connect to cleanup service: ${response.error.message || 'Unknown error'}`);
    }
    
    // Check response format
    if (!response.data) {
      throw new Error('Cleanup service returned an invalid response');
    }
    
    // Check for error in response data
    if (!response.data.success) {
      const errorMsg = response.data.error || 'Unknown error occurred during deletion';
      console.error('Deletion failed:', errorMsg);
      throw new Error(`Deletion failed: ${errorMsg}`);
    }
    
    // Verify deletion was successful
    if (response.data.cleaned === true) {
      addDebugMessage("Database successfully cleaned via edge function");
      
      // Additional verification
      const { count: orderCount, error: orderCountError } = await supabase
        .from('shopify_orders')
        .select('*', { count: 'exact', head: true });
        
      if (orderCountError) {
        addDebugMessage(`Error verifying deletion: ${orderCountError.message}`);
      } else if (orderCount && orderCount > 0) {
        addDebugMessage(`WARNING: Database still contains ${orderCount} orders after deletion`);
      } else {
        addDebugMessage("Verification confirmed: All orders have been deleted");
      }
    } else {
      addDebugMessage("WARNING: Edge function did not confirm successful deletion");
      throw new Error("Cleanup operation did not complete successfully");
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting orders:", error);
    throw error;
  }
};

/**
 * Get API token from database
 */
export const getTokenFromDatabase = async () => {
  try {
    // Using RPC for type safety
    const { data, error } = await supabase.rpc('get_shopify_setting', { 
      setting_name_param: 'shopify_token' 
    });
    
    if (error) {
      console.error('Error retrieving token from database:', error);
      return null;
    }
    
    // Check if we have a valid token (not the placeholder)
    if (data && typeof data === 'string' && data !== 'placeholder_token') {
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('Exception retrieving token:', error);
    return null;
  }
};
