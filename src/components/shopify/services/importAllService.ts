
import { supabase } from '@/integrations/supabase/client';
import { getTokenFromDatabase } from './cleanupService';

/**
 * Import all orders from Shopify
 */
export const importAllOrders = async (addDebugMessage: (message: string) => void) => {
  try {
    addDebugMessage("Getting API token from database...");
    const token = await getTokenFromDatabase();
    
    if (!token) {
      throw new Error("No API token found in database. Please add your Shopify API token first.");
    }
    
    addDebugMessage("Calling shopify-sync-all edge function...");
    
    // Add a timeout to the API call to prevent hanging indefinitely
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("API call timed out after 60 seconds")), 60000);
    });
    
    // Actual API call
    const apiCallPromise = supabase.functions.invoke('shopify-sync-all', {
      body: { 
        apiToken: token,
        operation: "import" // Specify operation type
      }
    });
    
    // Use Promise.race to implement the timeout
    const response = await Promise.race([apiCallPromise, timeoutPromise]) as any;

    if (response.error) {
      console.error('Error invoking shopify-sync-all function:', response.error);
      throw new Error(`Failed to connect to Shopify API: ${response.error.message || 'Unknown error'}`);
    }
    
    const data = response.data;
    
    if (!data || !data.success) {
      // Check for specific error conditions in the debug messages
      if (data?.debugMessages && Array.isArray(data.debugMessages)) {
        // Log all debug messages for troubleshooting
        data.debugMessages.forEach((msg: string) => addDebugMessage(`API: ${msg}`));
        
        // Look for rate limiting or authentication issues
        const rateLimitMsg = data.debugMessages.find((msg: string) => 
          msg.includes('rate limit') || msg.includes('429') || msg.includes('too many requests')
        );
        
        if (rateLimitMsg) {
          throw new Error("Shopify API rate limit exceeded. Please wait a few minutes and try again.");
        }
        
        const authMsg = data.debugMessages.find((msg: string) => 
          msg.includes('authentication failed') || msg.includes('401') || msg.includes('unauthorized')
        );
        
        if (authMsg) {
          throw new Error("Authentication failed. Your Shopify API token might be invalid or expired.");
        }
      }
      
      const errorMsg = data?.error || 'Unknown error occurred during Shopify sync';
      console.error('Shopify sync failed:', errorMsg);
      throw new Error(`Shopify sync failed: ${errorMsg}`);
    }
    
    // Verify that orders were imported with line items
    const { count: orderCount, error: orderCountError } = await supabase
      .from('shopify_orders')
      .select('*', { count: 'exact', head: true });
    
    if (orderCountError) {
      console.error('Error checking imported order count:', orderCountError);
    } else if (!orderCount || orderCount === 0) {
      throw new Error('No orders were imported from Shopify');
    }
    
    const { count: lineItemCount, error: lineItemCountError } = await supabase
      .from('shopify_order_items')
      .select('*', { count: 'exact', head: true })
      .neq("order_id", "00000000-0000-0000-0000-000000000000");
    
    if (lineItemCountError) {
      console.error('Error checking imported line item count:', lineItemCountError);
    } else if (!lineItemCount || lineItemCount === 0) {
      throw new Error('Orders were imported but no line items were created');
    }
    
    addDebugMessage(`Successfully imported ${data.imported || 0} orders with ${lineItemCount || 0} line items`);
    return data;
  } catch (error) {
    console.error("Error importing orders:", error);
    throw error;
  }
};

/**
 * Update the last sync time in the database
 */
export const updateLastSyncTime = async (addDebugMessage: (message: string) => void) => {
  try {
    addDebugMessage("Updating last sync time...");
    const { error: updateError } = await supabase.rpc("upsert_shopify_setting", {
      setting_name_param: "last_sync_time",
      setting_value_param: new Date().toISOString()
    });

    if (updateError) {
      throw new Error(`Failed to update last sync time: ${updateError.message}`);
    }
    addDebugMessage("Successfully updated last sync time");
  } catch (error) {
    console.error("Error updating last sync time:", error);
    throw error;
  }
};
