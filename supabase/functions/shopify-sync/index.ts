
// Supabase Edge Function
// This function handles synchronizing orders with Shopify
// It performs:
// 1. Importing new unfulfilled orders
// 2. Checking current orders for fulfillment status changes
// 3. Archiving fulfilled orders
// 4. Fixing any incorrectly archived unfulfilled orders (moving them back to active)

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.6";

// Set CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShopifyOrder {
  id: string;
  order_number: string;
  name: string;
  created_at: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  line_items: any[];
  shipping_address: any;
  fulfillment_status: string | null;
  note: string | null;
  line_item_count: number;
  location_id: string;
}

interface RequestBody {
  apiToken: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Get Supabase connection
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Initialize response data
  const responseData = {
    success: false,
    error: null,
    imported: 0,
    archived: 0,
    fixed: 0,
  };

  try {
    let body: RequestBody;
    try {
      body = await req.json();
    } catch (err) {
      console.error("Error parsing request body:", err);
      throw new Error("Invalid request body");
    }

    // Validate the API token
    if (!body.apiToken) {
      console.error("No API token provided");
      throw new Error("No API token provided");
    }

    console.log("Starting Shopify sync process");
    
    // STEP 1: Fix any incorrectly archived unfulfilled orders
    // This fixes orders that were archived while still having unfulfilled status
    console.log("Checking for incorrectly archived unfulfilled orders");
    const { data: archivedUnfulfilled, error: archivedError } = await supabase
      .from("shopify_archived_orders")
      .select("*")
      .eq("status", "unfulfilled");

    if (archivedError) {
      console.error("Error checking for archived unfulfilled orders:", archivedError);
    } else if (archivedUnfulfilled && archivedUnfulfilled.length > 0) {
      console.log(`Found ${archivedUnfulfilled.length} incorrectly archived unfulfilled orders to fix`);
      
      for (const order of archivedUnfulfilled) {
        console.log(`Fixing incorrectly archived order: ${order.shopify_order_id} (${order.shopify_order_number || order.shopify_order_id})`);
        
        // Check if order already exists in active table (avoid duplication)
        const { data: existingOrder } = await supabase
          .from("shopify_orders")
          .select("id")
          .eq("shopify_order_id", order.shopify_order_id)
          .maybeSingle();
        
        if (existingOrder) {
          console.log(`Order ${order.shopify_order_id} already exists in active orders, just removing from archive`);
          // Order exists in active table, just delete from archive
          const { error: deleteError } = await supabase
            .from("shopify_archived_orders")
            .delete()
            .eq("id", order.id);
          
          if (deleteError) {
            console.error(`Error deleting archived order ${order.shopify_order_id}:`, deleteError);
          } else {
            responseData.fixed++;
          }
        } else {
          console.log(`Moving order ${order.shopify_order_id} from archive to active table`);
          // Order doesn't exist in active table, move it
          
          // 1. Insert order into shopify_orders
          const { data: insertedOrder, error: insertError } = await supabase
            .from("shopify_orders")
            .insert({
              shopify_order_id: order.shopify_order_id,
              shopify_order_number: order.shopify_order_number,
              created_at: order.created_at,
              customer_name: order.customer_name,
              customer_email: order.customer_email,
              customer_phone: order.customer_phone,
              status: order.status,
              items_count: order.items_count,
              imported_at: new Date().toISOString(),
              note: order.note,
              shipping_address: order.shipping_address,
              location_id: order.location_id,
              location_name: order.location_name
            })
            .select()
            .single();
          
          if (insertError) {
            console.error(`Error inserting active order ${order.shopify_order_id}:`, insertError);
            continue;
          }
          
          // 2. Get line items for the archived order
          const { data: archivedLineItems, error: lineItemsError } = await supabase
            .from("shopify_archived_order_items")
            .select("*")
            .eq("archived_order_id", order.id);
          
          if (lineItemsError) {
            console.error(`Error getting archived line items for order ${order.shopify_order_id}:`, lineItemsError);
          } else if (archivedLineItems && archivedLineItems.length > 0) {
            // 3. Insert line items into shopify_order_items
            const lineItemsToInsert = archivedLineItems.map(item => ({
              order_id: insertedOrder.id,
              shopify_line_item_id: item.shopify_line_item_id,
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
              console.error(`Error inserting line items for order ${order.shopify_order_id}:`, insertLineItemsError);
            }
          }
          
          // 4. Delete from shopify_archived_orders
          const { error: deleteError } = await supabase
            .from("shopify_archived_orders")
            .delete()
            .eq("id", order.id);
          
          if (deleteError) {
            console.error(`Error deleting archived order ${order.shopify_order_id}:`, deleteError);
          } else {
            // 5. Delete archived line items
            const { error: deleteLineItemsError } = await supabase
              .from("shopify_archived_order_items")
              .delete()
              .eq("archived_order_id", order.id);
            
            if (deleteLineItemsError) {
              console.error(`Error deleting archived line items for order ${order.shopify_order_id}:`, deleteLineItemsError);
            }
            
            responseData.fixed++;
          }
        }
      }
    } else {
      console.log("No incorrectly archived unfulfilled orders found");
    }

    // STEP 2: Fetch new orders from Shopify
    console.log("Fetching unfulfilled orders from Shopify");
    const shopifyOrders = await fetchShopifyOrders(body.apiToken);
    console.log(`Retrieved ${shopifyOrders.length} orders from Shopify`);

    // STEP 3: Check for each Shopify order
    for (const shopifyOrder of shopifyOrders) {
      const orderNumber = shopifyOrder.name;
      const orderId = shopifyOrder.id;

      // Check if order exists in the database
      const { data: existingOrder, error: existingError } = await supabase
        .from("shopify_orders")
        .select("id")
        .eq("shopify_order_id", orderId)
        .maybeSingle();

      if (existingError) {
        console.error(`Error checking existing order ${orderId}:`, existingError);
        continue;
      }

      // If order doesn't exist, insert it
      if (!existingOrder) {
        console.log(`Importing new order: ${orderId} (${orderNumber})`);
        
        // Insert order
        const { data: insertedOrder, error: insertError } = await supabase
          .from("shopify_orders")
          .insert({
            shopify_order_id: orderId,
            shopify_order_number: orderNumber,
            created_at: shopifyOrder.created_at,
            customer_name: `${shopifyOrder.customer.first_name || ''} ${shopifyOrder.customer.last_name || ''}`.trim(),
            customer_email: shopifyOrder.customer.email,
            customer_phone: shopifyOrder.customer.phone,
            status: shopifyOrder.fulfillment_status || "unfulfilled",
            items_count: shopifyOrder.line_items.length,
            imported_at: new Date().toISOString(),
            note: shopifyOrder.note,
            shipping_address: shopifyOrder.shipping_address,
            location_id: shopifyOrder.location_id
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Error inserting order ${orderId}:`, insertError);
          continue;
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
            console.error(`Error inserting line items for order ${orderId}:`, insertLineItemsError);
          }
        }

        responseData.imported++;
      } else {
        console.log(`Order ${orderId} (${orderNumber}) already exists in database - checking fulfillment status`);
        
        // Update fulfillment status if it has changed
        if (shopifyOrder.fulfillment_status === "fulfilled") {
          console.log(`Order ${orderId} (${orderNumber}) is now fulfilled - archiving`);
          
          // Archive the order
          await archiveOrder(supabase, existingOrder.id, orderId);
          responseData.archived++;
        }
      }
    }

    // STEP 4: Check existing orders in database for fulfillment status changes
    console.log("Checking existing orders in database for fulfillment status changes");
    const { data: activeOrders, error: activeOrdersError } = await supabase
      .from("shopify_orders")
      .select("id, shopify_order_id, shopify_order_number");

    if (activeOrdersError) {
      console.error("Error fetching active orders:", activeOrdersError);
    } else if (activeOrders && activeOrders.length > 0) {
      console.log(`Checking fulfillment status for ${activeOrders.length} active orders`);
      
      for (const order of activeOrders) {
        // Check if the order still exists in the unfulfilled orders from Shopify
        const stillUnfulfilled = shopifyOrders.some(shopifyOrder => 
          shopifyOrder.id === order.shopify_order_id
        );
        
        if (!stillUnfulfilled) {
          console.log(`Order ${order.shopify_order_id} (${order.shopify_order_number || order.shopify_order_id}) is no longer unfulfilled - checking direct status`);
          
          // If not in unfulfilled list, check the order status directly
          try {
            const orderDetails = await fetchSingleOrder(body.apiToken, order.shopify_order_id);
            
            if (orderDetails.fulfillment_status === "fulfilled") {
              console.log(`Confirmed that order ${order.shopify_order_id} is now fulfilled - archiving`);
              
              // Archive the order
              await archiveOrder(supabase, order.id, order.shopify_order_id);
              responseData.archived++;
            } else {
              console.log(`Order ${order.shopify_order_id} is still not fulfilled (status: ${orderDetails.fulfillment_status || "unfulfilled"}) - keeping in active table`);
            }
          } catch (err) {
            console.error(`Error checking order ${order.shopify_order_id} status:`, err);
          }
        }
      }
    }

    // STEP 5: Update last sync time in settings
    const { error: updateError } = await supabase.rpc("upsert_shopify_setting", {
      setting_name_param: "last_sync_time",
      setting_value_param: new Date().toISOString()
    });

    if (updateError) {
      console.error("Error updating last sync time:", updateError);
    }

    responseData.success = true;
    console.log("Shopify sync completed successfully");

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in Shopify sync:", error);
    responseData.error = error.message;
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function fetchShopifyOrders(apiToken: string): Promise<ShopifyOrder[]> {
  // Fetch unfulfilled orders from Shopify
  const response = await fetch(
    "https://iron-city-hardware.myshopify.com/admin/api/2022-01/orders.json?status=open&fulfillment_status=unfulfilled",
    {
      headers: {
        "X-Shopify-Access-Token": apiToken,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Shopify API error:", errorText);
    throw new Error(`Shopify API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.orders;
}

async function fetchSingleOrder(apiToken: string, orderId: string): Promise<any> {
  // Fetch a single order by ID to check its current status
  const response = await fetch(
    `https://iron-city-hardware.myshopify.com/admin/api/2022-01/orders/${orderId}.json`,
    {
      headers: {
        "X-Shopify-Access-Token": apiToken,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Shopify API error for order ${orderId}:`, errorText);
    throw new Error(`Shopify API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.order;
}

async function archiveOrder(supabase: any, orderId: string, shopifyOrderId: string) {
  // Get the order data
  const { data: orderData, error: orderError } = await supabase
    .from("shopify_orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError) {
    console.error(`Error fetching order ${shopifyOrderId} for archiving:`, orderError);
    return false;
  }

  // Get the line items
  const { data: lineItems, error: lineItemsError } = await supabase
    .from("shopify_order_items")
    .select("*")
    .eq("order_id", orderId);

  if (lineItemsError) {
    console.error(`Error fetching line items for order ${shopifyOrderId}:`, lineItemsError);
  }

  // Insert into archived_orders
  const { data: archivedOrder, error: archiveError } = await supabase
    .from("shopify_archived_orders")
    .insert({
      shopify_order_id: orderData.shopify_order_id,
      shopify_order_number: orderData.shopify_order_number,
      created_at: orderData.created_at,
      customer_name: orderData.customer_name,
      customer_email: orderData.customer_email,
      customer_phone: orderData.customer_phone,
      status: "fulfilled", // Always set to fulfilled when archiving
      items_count: orderData.items_count,
      imported_at: orderData.imported_at,
      archived_at: new Date().toISOString(),
      note: orderData.note,
      shipping_address: orderData.shipping_address,
      location_id: orderData.location_id,
      location_name: orderData.location_name
    })
    .select()
    .single();

  if (archiveError) {
    console.error(`Error archiving order ${shopifyOrderId}:`, archiveError);
    return false;
  }

  // Insert line items into archived_order_items
  if (lineItems && lineItems.length > 0) {
    const archivedLineItems = lineItems.map(item => ({
      archived_order_id: archivedOrder.id,
      shopify_line_item_id: item.shopify_line_item_id,
      title: item.title,
      sku: item.sku,
      quantity: item.quantity,
      price: item.price,
      product_id: item.product_id,
      variant_id: item.variant_id,
      properties: item.properties,
      archived_at: new Date().toISOString()
    }));

    const { error: archiveLineItemsError } = await supabase
      .from("shopify_archived_order_items")
      .insert(archivedLineItems);

    if (archiveLineItemsError) {
      console.error(`Error archiving line items for order ${shopifyOrderId}:`, archiveLineItemsError);
    }
  }

  // Delete from orders
  const { error: deleteError } = await supabase
    .from("shopify_orders")
    .delete()
    .eq("id", orderId);

  if (deleteError) {
    console.error(`Error deleting order ${shopifyOrderId} after archiving:`, deleteError);
    return false;
  }

  // Delete line items
  const { error: deleteLineItemsError } = await supabase
    .from("shopify_order_items")
    .delete()
    .eq("order_id", orderId);

  if (deleteLineItemsError) {
    console.error(`Error deleting line items for order ${shopifyOrderId}:`, deleteLineItemsError);
  }

  return true;
}
