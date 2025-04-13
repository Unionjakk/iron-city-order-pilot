import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Get the Shopify API endpoint from the database
 */
export async function getShopifyApiEndpoint(debug: (message: string) => void): Promise<string> {
  try {
    debug("Getting Shopify API endpoint from database...");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      debug("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
      throw new Error("Missing Supabase environment variables");
    }
    
    const client = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: endpointData, error: endpointError } = await client.rpc("get_shopify_setting", {
      setting_name_param: "shopify_api_endpoint"
    });

    if (endpointError) {
      debug(`Failed to retrieve API endpoint: ${endpointError.message}`);
      throw new Error(`Failed to retrieve API endpoint: ${endpointError.message}`);
    }

    if (!endpointData || typeof endpointData !== 'string') {
      debug("No API endpoint found in database");
      throw new Error("No API endpoint found in database. Please add your Shopify API endpoint first.");
    }
    
    debug(`Shopify API endpoint: ${endpointData}`);
    return endpointData;
  } catch (error) {
    debug(`Error getting Shopify API endpoint: ${error.message}`);
    throw error;
  }
}

/**
 * Import a single order into the database
 */
export async function importOrder(order: any, orderId: string, orderNumber: string, debug: (message: string) => void): Promise<boolean> {
  try {
    debug(`Importing order ${orderId} (${orderNumber}) into database...`);
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      debug("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
      return false;
    }
    
    const client = createClient(supabaseUrl, supabaseServiceKey);
    
    // Extract customer name
    const customerName = `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim();
    
    // Upsert the order
    const { data: orderData, error: orderError } = await client
      .from('shopify_orders')
      .upsert(
        {
          shopify_order_id: orderId,
          shopify_order_number: order.order_number,
          customer_name: customerName,
          items_count: order.line_items?.length || 0,
          status: order.fulfillment_status || 'unfulfilled',
          imported_at: new Date().toISOString(),
          created_at: order.created_at
        },
        { onConflict: 'shopify_order_id', returning: 'minimal' }
      )
      .select('id')

    if (orderError) {
      debug(`Failed to upsert order ${orderId}: ${orderError.message}`);
      return false;
    }
    
    if (!orderData || orderData.length === 0) {
      debug(`Failed to retrieve order ID after upsert for order ${orderId}`);
      return false;
    }
    
    const internalOrderId = orderData[0].id;
    debug(`Upserted order ${orderId} with internal ID ${internalOrderId}`);
    
    // Process line items
    if (order.line_items && Array.isArray(order.line_items)) {
      for (const item of order.line_items) {
        // Ensure that required properties exist
        if (!item.id) {
          debug(`Skipping line item due to missing ID in order ${orderId}`);
          continue;
        }
        
        // Before upserting, check if location_id and location_name are null
        if (item.location_id === null || item.location_id === undefined) {
          debug(`Line item ${item.id} in order ${orderId} has null or undefined location_id`);
        }
        if (item.location_name === null || item.location_name === undefined) {
          debug(`Line item ${item.id} in order ${orderId} has null or undefined location_name`);
        }
        
        const { error: itemError } = await client
          .from('shopify_order_items')
          .upsert(
            {
              order_id: internalOrderId,
              shopify_line_item_id: item.id,
              sku: item.sku || 'N/A',
              title: item.title || 'N/A',
              quantity: item.quantity,
              price: item.price,
              location_id: item.location_id || null,
              location_name: item.location_name || null
            },
            { onConflict: 'order_id, shopify_line_item_id', returning: 'minimal' }
          );

        if (itemError) {
          debug(`Failed to upsert line item ${item.id} in order ${orderId}: ${itemError.message}`);
        } else {
          debug(`Upserted line item ${item.id} in order ${orderId}`);
        }
      }
    }
    
    debug(`Imported order ${orderId} (${orderNumber}) successfully`);
    return true;
  } catch (error: any) {
    debug(`Error importing order ${orderId} (${orderNumber}): ${error.message}`);
    return false;
  }
}

/**
 * Update the last sync time in the database
 */
export async function updateLastSyncTime(debug: (message: string) => void): Promise<boolean> {
  try {
    debug("Updating last sync time...");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      debug("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
      return false;
    }
    
    const client = createClient(supabaseUrl, supabaseServiceKey);

    const { error: updateError } = await client.rpc("upsert_shopify_setting", {
      setting_name_param: "last_sync_time",
      setting_value_param: new Date().toISOString()
    });

    if (updateError) {
      debug(`Failed to update last sync time: ${updateError.message}`);
      return false;
    }
    
    debug("Successfully updated last sync time");
    return true;
  } catch (error: any) {
    debug(`Error updating last sync time: ${error.message}`);
    return false;
  }
}

/**
 * Clean the database completely by deleting all Shopify orders and items
 */
export async function cleanDatabaseCompletely(debug: (message: string) => void): Promise<boolean> {
  try {
    debug("Cleaning database completely...");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      debug("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
      return false;
    }
    
    const client = createClient(supabaseUrl, supabaseServiceKey);
    
    // Delete all order items first
    const { error: deleteItemsError } = await client
      .from('shopify_order_items')
      .delete()
      .neq('order_id', null); // Delete all items

    if (deleteItemsError) {
      debug(`Failed to delete order items: ${deleteItemsError.message}`);
      return false;
    }
    debug("Deleted all order items");

    // Then delete all orders
    const { error: deleteOrdersError } = await client
      .from('shopify_orders')
      .delete()
      .neq('id', null); // Delete all orders

    if (deleteOrdersError) {
      debug(`Failed to delete orders: ${deleteOrdersError.message}`);
      return false;
    }
    debug("Deleted all orders");
    
    debug("Database cleaned successfully");
    return true;
  } catch (error: any) {
    debug(`Error cleaning database: ${error.message}`);
    return false;
  }
}

/**
 * Set the import status in the database
 */
export async function setImportStatus(status: string, debug: (message: string) => void): Promise<boolean> {
  try {
    debug(`Updating import status to: ${status}`);
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      debug("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
      return false;
    }
    
    const client = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error: statusError } = await client.rpc("upsert_shopify_setting", {
      setting_name_param: "shopify_import_status",
      setting_value_param: status
    });

    if (statusError) {
      debug(`Failed to update import status: ${statusError.message}`);
      return false;
    }
    
    debug(`Successfully updated import status to: ${status}`);
    return true;
  } catch (error) {
    debug(`Error updating import status: ${error.message}`);
    return false;
  }
}
