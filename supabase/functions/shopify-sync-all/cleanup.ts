
import { supabase } from "./client.ts";

/**
 * Clean database completely - bypasses RLS with service role
 */
export async function cleanDatabaseCompletely(debug: (message: string) => void) {
  try {
    debug("Performing complete database cleanup with service role privileges...");
    
    // Use service role client to bypass RLS
    const serviceClient = supabase;
    
    // Step 1: Delete all order items first - Using a more reliable approach
    debug("Deleting all order items with service role...");
    
    try {
      // First attempt - standard delete
      const { error: itemsDeleteError } = await serviceClient
        .from('shopify_order_items')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (itemsDeleteError) {
        debug(`Initial delete attempt failed: ${itemsDeleteError.message}`);
        
        // Fallback - Try with a direct SQL deletion if the first method fails
        // This helps bypass potential RLS or other constraints
        debug("Trying alternate deletion method for order items...");
        const { error: sqlDeleteError } = await serviceClient.rpc('delete_all_shopify_order_items');
        
        if (sqlDeleteError) {
          debug(`SQL delete method also failed: ${sqlDeleteError.message}`);
          throw new Error(`Could not delete order items: ${sqlDeleteError.message}`);
        }
        debug("Successfully deleted order items using SQL method");
      } else {
        debug("Successfully deleted order items");
      }
    } catch (deleteError) {
      debug(`Error during order items deletion: ${deleteError.message}`);
      throw deleteError;
    }
    
    // Step 2: Delete all orders - with similar fallback approach
    debug("Deleting all orders with service role...");
    
    try {
      // First attempt - standard delete
      const { error: ordersDeleteError } = await serviceClient
        .from('shopify_orders')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (ordersDeleteError) {
        debug(`Initial orders delete attempt failed: ${ordersDeleteError.message}`);
        
        // Fallback - Try with a direct SQL deletion
        debug("Trying alternate deletion method for orders...");
        const { error: sqlOrdersDeleteError } = await serviceClient.rpc('delete_all_shopify_orders');
        
        if (sqlOrdersDeleteError) {
          debug(`SQL delete method for orders also failed: ${sqlOrdersDeleteError.message}`);
          throw new Error(`Could not delete orders: ${sqlOrdersDeleteError.message}`);
        }
        debug("Successfully deleted orders using SQL method");
      } else {
        debug("Successfully deleted orders");
      }
    } catch (deleteOrdersError) {
      debug(`Error during orders deletion: ${deleteOrdersError.message}`);
      throw deleteOrdersError;
    }
    
    // Step 3: Verify both tables are empty
    const { count: orderCount, error: orderCountError } = await serviceClient
      .from('shopify_orders')
      .select('*', { count: 'exact', head: true });
    
    if (orderCountError) {
      debug(`Error verifying orders deletion: ${orderCountError.message}`);
    } else if (orderCount && orderCount > 0) {
      debug(`WARNING: ${orderCount} orders still remain after deletion attempt`);
    } else {
      debug("Verified all orders have been deleted successfully");
    }
    
    const { count: itemCount, error: itemCountError } = await serviceClient
      .from('shopify_order_items')
      .select('*', { count: 'exact', head: true });
    
    if (itemCountError) {
      debug(`Error verifying order items deletion: ${itemCountError.message}`);
    } else if (itemCount && itemCount > 0) {
      debug(`WARNING: ${itemCount} order items still remain after deletion attempt`);
    } else {
      debug("Verified all order items have been deleted successfully");
    }
    
    debug("Database cleanup completed with service role privileges");
    return true;
  } catch (error) {
    debug(`Error in cleanDatabaseCompletely: ${error.message}`);
    throw error;
  }
}
