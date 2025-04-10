
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
          updated_at: new Date().toISOString()
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

    // Insert line items
    if (shopifyOrder.line_items && Array.isArray(shopifyOrder.line_items) && shopifyOrder.line_items.length > 0) {
      debug(`Inserting ${shopifyOrder.line_items.length} line items for order ${orderId}`);
      
      const lineItemsToInsert = shopifyOrder.line_items.map(item => ({
        order_id: orderDbId,
        shopify_line_item_id: item.id,
        title: item.title || "Unknown Product",
        sku: item.sku,
        quantity: item.quantity || 1,
        price: item.price,
        product_id: item.product_id,
        variant_id: item.variant_id,
        properties: item.properties
      }));

      // Insert in batches of 50 to avoid potential size limits
      const batchSize = 50;
      for (let i = 0; i < lineItemsToInsert.length; i += batchSize) {
        const batch = lineItemsToInsert.slice(i, i + batchSize);
        
        const { error: insertLineItemsError } = await supabase
          .from("shopify_order_items")
          .insert(batch);

        if (insertLineItemsError) {
          debug(`Error inserting line items batch for order ${orderId}: ${insertLineItemsError.message}`);
          debug(`Batch data: ${JSON.stringify(batch)}`);
        } else {
          debug(`Successfully inserted ${batch.length} line items for order ${orderId} (batch ${i/batchSize + 1})`);
        }
      }
    } else {
      debug(`Warning: Order ${orderId} (${orderNumber}) has no line items or invalid line_items format`);
      
      // Create at least one default line item if none exist
      const { error: insertDefaultLineItemError } = await supabase
        .from("shopify_order_items")
        .insert({
          order_id: orderDbId,
          shopify_line_item_id: "default-" + orderId,
          title: "Unknown Product",
          quantity: 1,
          price: 0
        });

      if (insertDefaultLineItemError) {
        debug(`Error inserting default line item for order ${orderId}: ${insertDefaultLineItemError.message}`);
      } else {
        debug(`Created default line item for order ${orderId} that had no line items`);
      }
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
