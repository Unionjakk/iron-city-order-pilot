
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
    
    // Call the edge function for complete refresh
    const response = await supabase.functions.invoke('shopify-sync-all', {
      body: { 
        apiToken: token,
        operation: "import" // Specify operation type
      }
    });

    if (response.error) {
      console.error('Error invoking shopify-sync-all function:', response.error);
      throw new Error(`Failed to connect to Shopify API: ${response.error.message || 'Unknown error'}`);
    }
    
    const data = response.data;
    
    if (!data || !data.success) {
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
