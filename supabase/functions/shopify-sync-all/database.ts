
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
      
      return true;
    }

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

    // Insert line items
    if (shopifyOrder.line_items && shopifyOrder.line_items.length > 0) {
      const lineItemsToInsert = shopifyOrder.line_items.map(item => ({
        order_id: insertedOrder.id,
        shopify_line_item_id: item.id,
        title: item.title,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        product_id: item.product_id,
        variant_id: item.variant_id,
        properties: item.properties
      }));

      const { error: insertLineItemsError } = await supabase
        .from("shopify_order_items")
        .insert(lineItemsToInsert);

      if (insertLineItemsError) {
        debug(`Error inserting line items for order ${orderId}: ${insertLineItemsError.message}`);
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
