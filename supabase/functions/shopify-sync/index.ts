
// Supabase Edge Function
// This function handles synchronizing orders with Shopify
// It performs:
// 1. Importing new unfulfilled orders
// 2. Checking current orders for fulfillment status changes
// 3. Archiving fulfilled orders
// 4. Deleting any incorrectly archived unfulfilled orders

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
  apiToken?: string;
  autoImport?: boolean;
  timestamp?: number;
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
    cleaned: 0,
    autoImport: false,
  };

  try {
    let body: RequestBody = {};
    try {
      body = await req.json();
    } catch (err) {
      console.error("Error parsing request body:", err);
      // For cron jobs with empty body, this is expected
      // We'll try to get the API token from the database
    }

    // Mark if this is an auto-import from cron
    responseData.autoImport = !!body.autoImport;
    
    console.log(`Starting Shopify sync process. Auto import: ${responseData.autoImport}`);
    
    // Check auto-import setting if this is a cron job
    if (responseData.autoImport) {
      const { data: autoImportSetting } = await supabase.rpc("get_shopify_setting", { 
        setting_name_param: "auto_import_enabled" 
      });
      
      if (autoImportSetting !== "true") {
        console.log("Auto-import is disabled in settings. Skipping sync.");
        return new Response(JSON.stringify({
          success: true,
          skipped: true,
          message: "Auto-import is disabled in settings"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      console.log("Auto-import is enabled. Proceeding with sync.");
      
      // Update the last_cron_run timestamp if this is a cron job
      await supabase.rpc("upsert_shopify_setting", {
        setting_name_param: "last_cron_run",
        setting_value_param: new Date().toISOString()
      });
    }

    // Get API token - either from request or from database
    let apiToken = body.apiToken;
    
    // If no token in request (like in cron jobs), get from database
    if (!apiToken) {
      console.log("No API token in request, retrieving from database");
      const { data: tokenData, error: tokenError } = await supabase.rpc("get_shopify_setting", { 
        setting_name_param: "shopify_token" 
      });
      
      if (tokenError) {
        console.error("Error retrieving token from database:", tokenError);
        throw new Error("Failed to retrieve API token");
      }
      
      if (!tokenData || tokenData === "placeholder_token") {
        console.error("No valid API token found in database");
        throw new Error("No valid API token configured");
      }
      
      apiToken = tokenData;
    }

    // Validate the API token
    if (!apiToken) {
      console.error("No API token provided");
      throw new Error("No API token provided");
    }
    
    // STEP 1: DELETE any incorrectly archived unfulfilled orders
    // This completely removes orders that were archived while still having unfulfilled status
    console.log("Checking for incorrectly archived unfulfilled orders to delete");
    const { data: archivedUnfulfilled, error: archivedError } = await supabase
      .from("shopify_archived_orders")
      .select("id, shopify_order_id, shopify_order_number")
      .eq("status", "unfulfilled");

    if (archivedError) {
      console.error("Error checking for archived unfulfilled orders:", archivedError);
    } else if (archivedUnfulfilled && archivedUnfulfilled.length > 0) {
      console.log(`Found ${archivedUnfulfilled.length} incorrectly archived unfulfilled orders to delete`);
      
      for (const order of archivedUnfulfilled) {
        console.log(`Deleting incorrectly archived order: ${order.shopify_order_id} (${order.shopify_order_number || order.shopify_order_id})`);
        
        // First delete line items
        const { error: deleteLineItemsError } = await supabase
          .from("shopify_archived_order_items")
          .delete()
          .eq("archived_order_id", order.id);
        
        if (deleteLineItemsError) {
          console.error(`Error deleting archived line items for order ${order.shopify_order_id}:`, deleteLineItemsError);
          continue;
        }
        
        // Then delete the order
        const { error: deleteError } = await supabase
          .from("shopify_archived_orders")
          .delete()
          .eq("id", order.id);
        
        if (deleteError) {
          console.error(`Error deleting archived order ${order.shopify_order_id}:`, deleteError);
        } else {
          responseData.cleaned++;
        }
      }
    } else {
      console.log("No incorrectly archived unfulfilled orders found");
    }

    try {
      // STEP 2: Check for duplicate orders (exist in both active and archive)
      // and delete them from the archive
      console.log("Checking for duplicate orders");
      const { data: duplicateData, error: duplicateError } = await supabase
        .from("shopify_archived_orders")
        .select("id, shopify_order_id, shopify_order_number");
      
      if (duplicateError) {
        console.error("Error fetching archived order IDs:", duplicateError);
      } else if (duplicateData && duplicateData.length > 0) {
        const archivedOrderIds = duplicateData.map(order => order.shopify_order_id);
        
        // Check which of these IDs exist in the active orders table
        const { data: activeMatches, error: activeMatchError } = await supabase
          .from("shopify_orders")
          .select("shopify_order_id")
          .in("shopify_order_id", archivedOrderIds);
          
        if (activeMatchError) {
          console.error("Error checking for duplicates:", activeMatchError);
        } else if (activeMatches && activeMatches.length > 0) {
          console.log(`Found ${activeMatches.length} duplicate orders to clean up`);
          
          // Get the list of duplicate Shopify order IDs
          const duplicateIds = activeMatches.map(order => order.shopify_order_id);
          
          // Find the corresponding archived orders
          const duplicateArchived = duplicateData.filter(order => 
            duplicateIds.includes(order.shopify_order_id)
          );
          
          // Delete them from the archive
          for (const order of duplicateArchived) {
            console.log(`Deleting duplicate archived order: ${order.shopify_order_id} (${order.shopify_order_number || order.shopify_order_id})`);
            
            // First delete line items
            const { error: deleteLineItemsError } = await supabase
              .from("shopify_archived_order_items")
              .delete()
              .eq("archived_order_id", order.id);
            
            if (deleteLineItemsError) {
              console.error(`Error deleting archived line items for duplicate order ${order.shopify_order_id}:`, deleteLineItemsError);
              continue;
            }
            
            // Then delete the order
            const { error: deleteError } = await supabase
              .from("shopify_archived_orders")
              .delete()
              .eq("id", order.id);
            
            if (deleteError) {
              console.error(`Error deleting duplicate archived order ${order.shopify_order_id}:`, deleteError);
            } else {
              responseData.cleaned++;
            }
          }
        }
      }

      // STEP 3: Fetch new orders from Shopify
      console.log("Fetching unfulfilled orders from Shopify");
      const shopifyOrders = await fetchShopifyOrders(apiToken);
      console.log(`Retrieved ${shopifyOrders.length} orders from Shopify`);

      // STEP 4: Check for each Shopify order
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
          
          // Insert order - UPDATED to use "unfulfilled" instead of "imported"
          const { data: insertedOrder, error: insertError } = await supabase
            .from("shopify_orders")
            .insert({
              shopify_order_id: orderId,
              shopify_order_number: orderNumber,
              created_at: shopifyOrder.created_at,
              customer_name: `${shopifyOrder.customer?.first_name || ''} ${shopifyOrder.customer?.last_name || ''}`.trim(),
              customer_email: shopifyOrder.customer?.email,
              customer_phone: shopifyOrder.customer?.phone,
              status: "unfulfilled", // Changed from shopifyOrder.fulfillment_status || "imported"
              items_count: shopifyOrder.line_items?.length || 0,
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

      // STEP 5: Check existing orders in database for fulfillment status changes
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
              const orderDetails = await fetchSingleOrder(apiToken, order.shopify_order_id);
              
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
    } catch (error) {
      console.error("Error in Shopify API operations:", error);
      throw error;
    }

    // STEP 6: Update last sync time in settings
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
  try {
    // Updated URL to use the correct store URL and API version
    const response = await fetch(
      "https://opus-harley-davidson.myshopify.com/admin/api/2023-07/orders.json?status=open&fulfillment_status=unfulfilled",
      {
        headers: {
          "X-Shopify-Access-Token": apiToken,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Shopify API error (${response.status}):`, errorText);
      
      if (response.status === 401) {
        throw new Error("Authentication failed. Your Shopify API token might be invalid or expired.");
      } else if (response.status === 404) {
        throw new Error("Store not found. Please verify your Shopify store URL is correct and the app is installed.");
      } else if (response.status === 403) {
        throw new Error("Access forbidden. Your API token might not have the necessary permissions.");
      } else {
        throw new Error(`Shopify API error: ${response.status} - ${errorText || "Unknown error"}`);
      }
    }

    const data = await response.json();
    if (!data.orders || !Array.isArray(data.orders)) {
      console.error("Unexpected Shopify API response format:", data);
      throw new Error("Received unexpected data format from Shopify API");
    }
    return data.orders;
  } catch (error) {
    console.error("Exception in fetchShopifyOrders:", error);
    throw error;
  }
}

async function fetchSingleOrder(apiToken: string, orderId: string): Promise<any> {
  // Fetch a single order by ID to check its current status
  try {
    // Updated URL to use the correct store URL and API version
    const response = await fetch(
      `https://opus-harley-davidson.myshopify.com/admin/api/2023-07/orders/${orderId}.json`,
      {
        headers: {
          "X-Shopify-Access-Token": apiToken,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Shopify API error for order ${orderId} (${response.status}):`, errorText);
      
      if (response.status === 401) {
        throw new Error("Authentication failed. Your Shopify API token might be invalid or expired.");
      } else if (response.status === 404) {
        throw new Error(`Order ${orderId} not found in Shopify.`);
      } else {
        throw new Error(`Shopify API error: ${response.status} - ${errorText || "Unknown error"}`);
      }
    }

    const data = await response.json();
    if (!data.order) {
      console.error("Unexpected Shopify API response format for single order:", data);
      throw new Error("Invalid order data returned from Shopify API");
    }
    return data.order;
  } catch (error) {
    console.error(`Exception in fetchSingleOrder for order ${orderId}:`, error);
    throw error;
  }
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
