import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.6";
import { ShopifyOrder } from "./types.ts";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
export const supabase = createClient(supabaseUrl, supabaseKey);

// Import an order (regardless of fulfillment status)
export async function importOrder(
  shopifyOrder: ShopifyOrder, 
  orderId: string, 
  orderNumber: string,
  debug: (message: string) => void
) {
  debug(`Importing order: ${orderId} (${orderNumber})`);
  
  try {
    // Check if order already exists
    const { data: existingOrder, error: checkError } = await supabase
      .from("shopify_orders")
      .select("id")
      .eq("shopify_order_id", orderId)
      .maybeSingle();

    if (checkError) {
      debug(`Error checking existing order ${orderId}: ${checkError.message}`);
      return false;
    }

    let orderDbId: string;

    if (existingOrder) {
      debug(`Order ${orderId} (${orderNumber}) already exists - updating`);
      
      // Update existing order
      const { error: updateError } = await supabase
        .from("shopify_orders")
        .update({
          status: shopifyOrder.fulfillment_status || "unfulfilled",
          imported_at: new Date().toISOString()
        })
        .eq("id", existingOrder.id);

      if (updateError) {
        debug(`Error updating order ${orderId}: ${updateError.message}`);
        return false;
      }
      
      orderDbId = existingOrder.id;

      // Delete existing line items to avoid duplicates
      const { error: deleteLineItemsError } = await supabase
        .from("shopify_order_items")
        .delete()
        .eq("order_id", orderDbId);

      if (deleteLineItemsError) {
        debug(`Error deleting existing line items for order ${orderId}: ${deleteLineItemsError.message}`);
        // Continue anyway as we'll try to insert new line items
      }
    } else {
      // Insert new order
      const { data: insertedOrder, error: insertError } = await supabase
        .from("shopify_orders")
        .insert({
          shopify_order_id: orderId,
          shopify_order_number: orderNumber,
          created_at: shopifyOrder.created_at,
          customer_name: `${shopifyOrder.customer?.first_name || ''} ${shopifyOrder.customer?.last_name || ''}`.trim(),
          customer_email: shopifyOrder.customer?.email,
          customer_phone: shopifyOrder.customer?.phone,
          status: shopifyOrder.fulfillment_status || "unfulfilled",
          items_count: shopifyOrder.line_items?.length || 0,
          imported_at: new Date().toISOString(),
          note: shopifyOrder.note,
          shipping_address: shopifyOrder.shipping_address,
          location_id: shopifyOrder.location_id
        })
        .select()
        .single();

      if (insertError) {
        debug(`Error inserting order ${orderId}: ${insertError.message}`);
        return false;
      }

      if (!insertedOrder) {
        debug(`Error: No order ID returned after inserting order ${orderId}`);
        return false;
      }

      orderDbId = insertedOrder.id;
    }

    // Check if line items exist and are valid
    const hasValidLineItems = shopifyOrder.line_items && Array.isArray(shopifyOrder.line_items) && shopifyOrder.line_items.length > 0;
    
    if (hasValidLineItems) {
      debug(`Inserting ${shopifyOrder.line_items.length} line items for order ${orderId}`);
      
      const lineItemsToInsert = shopifyOrder.line_items.map(item => ({
        order_id: orderDbId,
        shopify_line_item_id: item.id || `default-${Math.random().toString(36).substring(2, 15)}`,
        title: item.title || "Unknown Product",
        sku: item.sku || "",
        quantity: item.quantity || 1,
        price: item.price || "0.00",
        product_id: item.product_id || "",
        variant_id: item.variant_id || "",
        properties: item.properties || null
      }));

      // Insert in small batches to avoid potential size limits
      const batchSize = 20;
      for (let i = 0; i < lineItemsToInsert.length; i += batchSize) {
        const batch = lineItemsToInsert.slice(i, i + batchSize);
        
        const { error: insertLineItemsError } = await supabase
          .from("shopify_order_items")
          .insert(batch);

        if (insertLineItemsError) {
          debug(`Error inserting line items batch for order ${orderId}: ${insertLineItemsError.message}`);
          debug(`Error details: ${JSON.stringify(insertLineItemsError)}`);
          
          // Try inserting one by one if batch insert fails
          for (const lineItem of batch) {
            const { error: singleInsertError } = await supabase
              .from("shopify_order_items")
              .insert(lineItem);
              
            if (singleInsertError) {
              debug(`Error inserting single line item for order ${orderId}: ${singleInsertError.message}`);
            }
          }
        } else {
          debug(`Successfully inserted ${batch.length} line items for order ${orderId} (batch ${i/batchSize + 1})`);
        }
      }
    } else {
      debug(`Warning: Order ${orderId} (${orderNumber}) has no line items or invalid line_items format`);
      
      // Create at least one default line item if none exist
      const defaultLineItem = {
        order_id: orderDbId,
        shopify_line_item_id: `default-${orderId}`,
        title: "Default Product",
        quantity: 1,
        price: "0.00"
      };
      
      const { error: insertDefaultLineItemError } = await supabase
        .from("shopify_order_items")
        .insert(defaultLineItem);

      if (insertDefaultLineItemError) {
        debug(`Error inserting default line item for order ${orderId}: ${insertDefaultLineItemError.message}`);
        debug(`Error details: ${JSON.stringify(insertDefaultLineItemError)}`);
        
        // One last attempt with minimal data
        const { error: finalAttemptError } = await supabase
          .from("shopify_order_items")
          .insert({
            order_id: orderDbId,
            shopify_line_item_id: `emergency-${Date.now()}`,
            title: "Unknown Product",
            quantity: 1
          });
          
        if (finalAttemptError) {
          debug(`Final attempt to insert default line item failed: ${finalAttemptError.message}`);
        } else {
          debug(`Successfully inserted emergency default line item for order ${orderId}`);
        }
      } else {
        debug(`Created default line item for order ${orderId} that had no line items`);
      }
    }
    
    // Verify that line items were created
    const { count, error: countError } = await supabase
      .from("shopify_order_items")
      .select("*", { count: 'exact', head: true })
      .eq("order_id", orderDbId);
      
    if (countError) {
      debug(`Error verifying line items for order ${orderId}: ${countError.message}`);
    } else if (!count || count === 0) {
      debug(`WARNING: No line items were created for order ${orderId} - creating emergency line item`);
      
      // Last resort - create basic line item
      const { error: emergencyError } = await supabase
        .from("shopify_order_items")
        .insert({
          order_id: orderDbId,
          shopify_line_item_id: `emergency-${Date.now()}`,
          title: "Fallback Product",
          quantity: 1
        });
        
      if (emergencyError) {
        debug(`Failed to create emergency line item: ${emergencyError.message}`);
      } else {
        debug(`Created emergency line item for order ${orderId}`);
      }
    } else {
      debug(`Verified ${count} line items for order ${orderId}`);
    }
    
    return true;
  } catch (error) {
    debug(`Exception importing order ${orderId}: ${error.message}`);
    return false;
  }
}

// Update last sync time
export async function updateLastSyncTime(debug: (message: string) => void) {
  const { error: updateError } = await supabase.rpc("upsert_shopify_setting", {
    setting_name_param: "last_sync_time",
    setting_value_param: new Date().toISOString()
  });

  if (updateError) {
    debug(`Error updating last sync time: ${updateError.message}`);
    return false;
  }
  
  return true;
}

// Get Shopify API endpoint from settings
export async function getShopifyApiEndpoint(debug: (message: string) => void) {
  const { data: endpointData, error: endpointError } = await supabase.rpc("get_shopify_setting", { 
    setting_name_param: "shopify_api_endpoint" 
  });
  
  if (endpointError) {
    debug(`Error retrieving API endpoint from database: ${endpointError.message}`);
    throw new Error("Failed to retrieve API endpoint configuration");
  }
  
  // Use the stored endpoint or fall back to the default if not configured
  return endpointData || "https://opus-harley-davidson.myshopify.com/admin/api/2023-07/orders.json";
}

// Function to clean database completely - bypasses RLS with service role
export async function cleanDatabaseCompletely(debug: (message: string) => void) {
  try {
    debug("Performing complete database cleanup with service role privileges...");
    
    // Use service role client to bypass RLS
    const serviceClient = supabase;
    
    // Step 1: Delete all order items first
    debug("Deleting all order items with service role...");
    const { error: itemsDeleteError } = await serviceClient
      .from('shopify_order_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (itemsDeleteError) {
      debug(`Error deleting order items: ${itemsDeleteError.message}`);
      throw new Error(`Failed to delete order items: ${itemsDeleteError.message}`);
    }
    
    // Step 2: Delete all orders
    debug("Deleting all orders with service role...");
    const { error: ordersDeleteError } = await serviceClient
      .from('shopify_orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (ordersDeleteError) {
      debug(`Error deleting orders: ${ordersDeleteError.message}`);
      throw new Error(`Failed to delete orders: ${ordersDeleteError.message}`);
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
