
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
  console.log("=== Shopify Sync Function Started ===");
  console.log(`Request method: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
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
      console.log("Request body parsed successfully:", JSON.stringify(body));
    } catch (err) {
      console.log("Empty or invalid request body - this is expected for cron jobs");
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
      console.log("Successfully retrieved API token from database");
    }

    // Validate the API token
    if (!apiToken) {
      console.error("No API token provided");
      throw new Error("No API token provided");
    }
    
    // STEP 1: DELETE any incorrectly archived unfulfilled orders
    console.log("Checking for incorrectly archived unfulfilled orders to delete");
    const { data: incorrectlyArchived, error: archiveCheckError } = await supabase
      .from("shopify_archived_orders")
      .select("id, shopify_order_id, shopify_order_number")
      .neq("status", "fulfilled");

    if (archiveCheckError) {
      console.error("Error checking for incorrectly archived orders:", archiveCheckError);
    } else if (incorrectlyArchived && incorrectlyArchived.length > 0) {
      console.log(`Found ${incorrectlyArchived.length} incorrectly archived orders - deleting`);
      for (const order of incorrectlyArchived) {
        const { error: deleteError } = await supabase
          .from("shopify_archived_orders")
          .delete()
          .eq("id", order.id);

        if (deleteError) {
          console.error(`Error deleting incorrectly archived order ${order.shopify_order_id}:`, deleteError);
        } else {
          console.log(`Deleted incorrectly archived order ${order.shopify_order_id} (${order.shopify_order_number})`);
          responseData.cleaned++;
        }
      }
    } else {
      console.log("No incorrectly archived orders found");
    }

    try {
      // STEP 2: Check for duplicate orders (exist in both active and archive)
      console.log("Checking for duplicate orders");
      
      try {
        // Use a different query approach to avoid the map issue
        const { data: activeOrderIds, error: activeError } = await supabase
          .from('shopify_orders')
          .select('shopify_order_id');
          
        if (activeError) {
          console.error("Error getting active order IDs:", activeError);
          throw activeError;
        }
        
        if (!activeOrderIds || !Array.isArray(activeOrderIds)) {
          console.log("No active orders found or result is not an array");
          // Continue with the sync even if there are no active orders
        } else {
          // Convert array of objects to array of IDs
          const orderIds = activeOrderIds.map(o => o.shopify_order_id);
          console.log(`Found ${orderIds.length} active order IDs to check for duplicates`);
          
          if (orderIds.length > 0) {
            // Check for these IDs in the archived orders table
            const { data: duplicateOrders, error: duplicateError } = await supabase
              .from('shopify_archived_orders')
              .select('id, shopify_order_id')
              .in('shopify_order_id', orderIds);
              
            if (duplicateError) {
              console.error("Error checking for duplicate orders:", duplicateError);
            } else if (duplicateOrders && duplicateOrders.length > 0) {
              console.log(`Found ${duplicateOrders.length} duplicate orders - deleting from archive`);
              for (const order of duplicateOrders) {
                const { error: deleteError } = await supabase
                  .from("shopify_archived_orders")
                  .delete()
                  .eq("id", order.id);

                if (deleteError) {
                  console.error(`Error deleting duplicate order ${order.shopify_order_id} from archive:`, deleteError);
                } else {
                  console.log(`Deleted duplicate order ${order.shopify_order_id} from archive`);
                  responseData.cleaned++;
                }
              }
            } else {
              console.log("No duplicate orders found");
            }
          }
        }
      } catch (error) {
        console.error("Error in duplicate order check:", error);
        // Continue with the sync even if the duplicate check fails
      }

      // Get API endpoint from database
      const { data: endpointData, error: endpointError } = await supabase.rpc("get_shopify_setting", { 
        setting_name_param: "shopify_api_endpoint" 
      });
      
      if (endpointError) {
        console.error("Error retrieving API endpoint from database:", endpointError);
        throw new Error("Failed to retrieve API endpoint configuration");
      }
      
      // Use the stored endpoint or fall back to the default if not configured
      const apiEndpoint = endpointData || "https://opus-harley-davidson.myshopify.com/admin/api/2023-07/orders.json";
      console.log(`Using Shopify API endpoint: ${apiEndpoint}`);

      // STEP 3: Fetch ALL unfulfilled orders from Shopify with proper pagination
      console.log("Fetching unfulfilled orders from Shopify");
      let shopifyOrders: ShopifyOrder[] = [];
      let nextPageUrl: string | null = null;
      
      // First page of orders - use fetchShopifyOrdersWithPagination function
      const firstPageResult = await fetchShopifyOrdersWithPagination(apiToken, apiEndpoint);
      shopifyOrders = firstPageResult.orders;
      nextPageUrl = firstPageResult.nextPageUrl;
      
      console.log(`Retrieved ${shopifyOrders.length} orders from first page`);
      
      // Continue fetching if there are more pages
      let pageCount = 1;
      // No page limit - fetch all unfulfilled orders
      
      while (nextPageUrl) {
        pageCount++;
        console.log(`Fetching page ${pageCount} from ${nextPageUrl}`);
        
        try {
          const nextPageResult = await fetchNextPage(apiToken, nextPageUrl);
          shopifyOrders = [...shopifyOrders, ...nextPageResult.orders];
          nextPageUrl = nextPageResult.nextPageUrl;
          
          console.log(`Retrieved ${nextPageResult.orders.length} more orders from page ${pageCount}`);
        } catch (err) {
          console.error(`Error fetching page ${pageCount}:`, err);
          break; // Stop pagination on error but continue with orders we have
        }
        
        // Add a small delay to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`Total orders retrieved: ${shopifyOrders.length}`);

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
        
        // Use a rate-limited check to avoid hitting Shopify API limits
        for (const order of activeOrders) {
          // Check if the order still exists in the unfulfilled orders from Shopify
          const stillUnfulfilled = shopifyOrders.some(shopifyOrder => 
            shopifyOrder.id === order.shopify_order_id
          );
          
          if (!stillUnfulfilled) {
            console.log(`Order ${order.shopify_order_id} (${order.shopify_order_number || order.shopify_order_id}) is no longer unfulfilled - checking direct status`);
            
            try {
              // Add a small delay to avoid hitting rate limits
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // If not in unfulfilled list, check the order status directly
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
    console.log(`Summary: Imported ${responseData.imported}, Archived ${responseData.archived}, Cleaned ${responseData.cleaned}`);

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

// Updated function to use Shopify pagination pattern for consistency
async function fetchShopifyOrdersWithPagination(apiToken: string, apiEndpoint: string): Promise<{ orders: ShopifyOrder[], nextPageUrl: string | null }> {
  try {
    // Parse the base URL and add query parameters
    const url = new URL(apiEndpoint);
    
    // Add query parameters if they don't exist (but don't override existing ones)
    if (!url.searchParams.has('status')) {
      url.searchParams.set('status', 'unfulfilled');
    }
    
    if (!url.searchParams.has('limit')) {
      url.searchParams.set('limit', '250'); // Increased from 50 to 250 (Shopify API max)
    }
    
    if (!url.searchParams.has('fields')) {
      url.searchParams.set('fields', 'id,name,created_at,customer,line_items,shipping_address,note,fulfillment_status');
    }
    
    console.log(`Fetching orders from: ${url.toString()}`);
    
    const response = await fetch(url.toString(), {
      headers: {
        "X-Shopify-Access-Token": apiToken,
        "Content-Type": "application/json",
      },
    });

    // Log detailed response information
    console.log(`Response status: ${response.status} ${response.statusText}`);
    console.log(`Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Shopify API error (${response.status}):`, errorText);
      
      if (response.status === 401) {
        throw new Error("Authentication failed. Your Shopify API token might be invalid or expired.");
      } else if (response.status === 404) {
        throw new Error("Store not found. Please verify your Shopify store URL is correct and the app is installed.");
      } else if (response.status === 403) {
        throw new Error("Access forbidden. Your API token might not have the necessary permissions.");
      } else if (response.status === 429) {
        console.warn("Rate limit hit, waiting and retrying...");
        // Wait for 2 seconds and retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchShopifyOrdersWithPagination(apiToken, apiEndpoint);
      } else {
        throw new Error(`Shopify API error: ${response.status} - ${errorText || "Unknown error"}`);
      }
    }

    const data = await response.json();
    console.log(`Received data structure: ${Object.keys(data).join(', ')}`);
    
    if (!data.orders || !Array.isArray(data.orders)) {
      console.error("Unexpected Shopify API response format:", data);
      throw new Error("Received unexpected data format from Shopify API");
    }
    
    // Get the Link header for pagination
    const linkHeader = response.headers.get('Link');
    let nextPageUrl: string | null = null;
    
    if (linkHeader) {
      console.log(`Link header: ${linkHeader}`);
      // Parse the Link header to find the next page URL
      const links = linkHeader.split(',');
      for (const link of links) {
        const parts = link.split(';');
        if (parts.length === 2 && parts[1].trim().includes('rel="next"')) {
          // Extract URL from <url> format
          const urlMatch = parts[0].trim().match(/<(.+)>/);
          if (urlMatch && urlMatch[1]) {
            nextPageUrl = urlMatch[1];
            break;
          }
        }
      }
    }
    
    console.log(`Fetched ${data.orders.length} orders, next page URL: ${nextPageUrl || 'none'}`);
    
    return { 
      orders: data.orders, 
      nextPageUrl 
    };
  } catch (error) {
    console.error(`Exception in fetchShopifyOrdersWithPagination:`, error);
    throw error;
  }
}

// Function to fetch subsequent pages using the Link header URLs
async function fetchNextPage(apiToken: string, nextPageUrl: string): Promise<{ orders: ShopifyOrder[], nextPageUrl: string | null }> {
  try {
    console.log(`Fetching next page from: ${nextPageUrl}`);
    
    const response = await fetch(nextPageUrl, {
      headers: {
        "X-Shopify-Access-Token": apiToken,
        "Content-Type": "application/json",
      },
    });

    // Log detailed response information
    console.log(`Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Shopify API error (${response.status}):`, errorText);
      
      if (response.status === 429) {
        console.warn("Rate limit hit, waiting and retrying...");
        // Wait for 2 seconds and retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchNextPage(apiToken, nextPageUrl);
      } else {
        throw new Error(`Shopify API error: ${response.status} - ${errorText || "Unknown error"}`);
      }
    }

    const data = await response.json();
    if (!data.orders || !Array.isArray(data.orders)) {
      console.error("Unexpected Shopify API response format:", data);
      throw new Error("Received unexpected data format from Shopify API");
    }
    
    // Get the Link header for pagination
    const linkHeader = response.headers.get('Link');
    let newNextPageUrl: string | null = null;
    
    if (linkHeader) {
      // Parse the Link header to find the next page URL
      const links = linkHeader.split(',');
      for (const link of links) {
        const parts = link.split(';');
        if (parts.length === 2 && parts[1].trim().includes('rel="next"')) {
          // Extract URL from <url> format
          const urlMatch = parts[0].trim().match(/<(.+)>/);
          if (urlMatch && urlMatch[1]) {
            newNextPageUrl = urlMatch[1];
            break;
          }
        }
      }
    }
    
    console.log(`Fetched ${data.orders.length} orders, next page URL: ${newNextPageUrl || 'none'}`);
    
    return { 
      orders: data.orders, 
      nextPageUrl: newNextPageUrl 
    };
  } catch (error) {
    console.error(`Exception in fetchNextPage:`, error);
    throw error;
  }
}

async function fetchSingleOrder(apiToken: string, orderId: string): Promise<any> {
  // Get API endpoint base from database
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: endpointData, error: endpointError } = await supabase.rpc("get_shopify_setting", { 
    setting_name_param: "shopify_api_endpoint" 
  });
  
  if (endpointError) {
    console.error("Error retrieving API endpoint from database:", endpointError);
    throw new Error("Failed to retrieve API endpoint configuration");
  }
  
  // Extract the base URL from the endpoint
  let baseUrl = "https://opus-harley-davidson.myshopify.com/admin/api/2023-07";
  
  if (endpointData) {
    try {
      const urlObj = new URL(endpointData);
      // Extract everything before the /orders.json part
      const pathParts = urlObj.pathname.split('/');
      pathParts.pop(); // Remove orders.json
      baseUrl = urlObj.origin + pathParts.join('/');
    } catch (e) {
      console.error("Error parsing API endpoint:", e);
    }
  }
  
  // Construct the single order endpoint
  const singleOrderUrl = `${baseUrl}/orders/${orderId}.json`;
  console.log(`Fetching single order from: ${singleOrderUrl}`);
  
  // Fetch a single order by ID to check its current status
  try {
    const response = await fetch(singleOrderUrl, {
      headers: {
        "X-Shopify-Access-Token": apiToken,
        "Content-Type": "application/json",
      },
    });

    // Log detailed response information
    console.log(`Response status for order ${orderId}: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Shopify API error for order ${orderId} (${response.status}):`, errorText);
      
      if (response.status === 401) {
        throw new Error("Authentication failed. Your Shopify API token might be invalid or expired.");
      } else if (response.status === 404) {
        throw new Error(`Order ${orderId} not found in Shopify.`);
      } else if (response.status === 429) {
        console.warn("Rate limit hit, waiting and retrying...");
        // Wait for 2 seconds and retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchSingleOrder(apiToken, orderId);
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
