
// Supabase Edge Function
// This function handles importing ALL orders from Shopify
// It imports both fulfilled and unfulfilled orders

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
}

serve(async (req) => {
  console.log("=== Shopify Sync ALL Function Started ===");
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
    fulfilled: 0,
    debugMessages: [] as string[]
  };

  // Helper function to add debug messages
  const debug = (message: string) => {
    console.log(message);
    responseData.debugMessages.push(message);
  };

  try {
    let body: RequestBody = {};
    try {
      body = await req.json();
      debug(`Request body parsed successfully: ${JSON.stringify(body)}`);
    } catch (err) {
      debug("Empty or invalid request body");
      throw new Error("Invalid request body");
    }

    // Get API token from request
    let apiToken = body.apiToken;
    
    // Validate the API token
    if (!apiToken) {
      debug("No API token provided");
      throw new Error("No API token provided");
    }
    
    debug("Starting import of ALL orders from Shopify");

    try {
      // Get API endpoint from database
      const { data: endpointData, error: endpointError } = await supabase.rpc("get_shopify_setting", { 
        setting_name_param: "shopify_api_endpoint" 
      });
      
      if (endpointError) {
        debug(`Error retrieving API endpoint from database: ${endpointError.message}`);
        throw new Error("Failed to retrieve API endpoint configuration");
      }
      
      // Use the stored endpoint or fall back to the default if not configured
      const apiEndpoint = endpointData || "https://opus-harley-davidson.myshopify.com/admin/api/2023-07/orders.json";
      debug(`Using Shopify API endpoint: ${apiEndpoint}`);

      // STEP 1: Fetch ALL orders from Shopify with proper pagination (not just unfulfilled)
      debug("Fetching ALL orders from Shopify (both fulfilled and unfulfilled)");
      let shopifyOrders: ShopifyOrder[] = [];
      let nextPageUrl: string | null = null;
      
      // First page of orders - get all orders, not just unfulfilled
      const firstPageResult = await fetchAllShopifyOrdersWithPagination(apiToken, apiEndpoint);
      shopifyOrders = firstPageResult.orders;
      nextPageUrl = firstPageResult.nextPageUrl;
      
      debug(`Retrieved ${shopifyOrders.length} orders from first page`);
      
      // Continue fetching if there are more pages
      let pageCount = 1;
      // No page limit - fetch all orders
      
      while (nextPageUrl) {
        pageCount++;
        debug(`Fetching page ${pageCount} from ${nextPageUrl}`);
        
        try {
          const nextPageResult = await fetchNextPage(apiToken, nextPageUrl);
          shopifyOrders = [...shopifyOrders, ...nextPageResult.orders];
          nextPageUrl = nextPageResult.nextPageUrl;
          
          debug(`Retrieved ${nextPageResult.orders.length} more orders from page ${pageCount}`);
        } catch (err) {
          debug(`Error fetching page ${pageCount}: ${err.message}`);
          break; // Stop pagination on error but continue with orders we have
        }
        
        // Add a small delay to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      debug(`Total orders retrieved: ${shopifyOrders.length}`);

      // STEP 2: Import all orders
      for (const shopifyOrder of shopifyOrders) {
        const orderNumber = shopifyOrder.name;
        const orderId = shopifyOrder.id;
        const isFulfilled = shopifyOrder.fulfillment_status === "fulfilled";
        
        debug(`Processing order: ${orderId} (${orderNumber}) - Status: ${shopifyOrder.fulfillment_status || "unfulfilled"}`);

        if (isFulfilled) {
          // Insert into archived orders
          debug(`Importing fulfilled order: ${orderId} (${orderNumber})`);
          
          const { data: archivedOrder, error: archiveError } = await supabase
            .from("shopify_archived_orders")
            .insert({
              shopify_order_id: orderId,
              shopify_order_number: orderNumber,
              created_at: shopifyOrder.created_at,
              customer_name: `${shopifyOrder.customer?.first_name || ''} ${shopifyOrder.customer?.last_name || ''}`.trim(),
              customer_email: shopifyOrder.customer?.email,
              customer_phone: shopifyOrder.customer?.phone,
              status: "fulfilled",
              items_count: shopifyOrder.line_items?.length || 0,
              imported_at: new Date().toISOString(),
              archived_at: new Date().toISOString(),
              note: shopifyOrder.note,
              shipping_address: shopifyOrder.shipping_address,
              location_id: shopifyOrder.location_id
            })
            .select()
            .single();

          if (archiveError) {
            debug(`Error inserting archived order ${orderId}: ${archiveError.message}`);
            continue;
          }

          // Insert archived line items
          if (shopifyOrder.line_items && shopifyOrder.line_items.length > 0) {
            const lineItemsToInsert = shopifyOrder.line_items.map(item => ({
              archived_order_id: archivedOrder.id,
              shopify_line_item_id: item.id,
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
              .insert(lineItemsToInsert);

            if (archiveLineItemsError) {
              debug(`Error inserting archived line items for order ${orderId}: ${archiveLineItemsError.message}`);
            }
          }

          responseData.fulfilled++;
        } else {
          // Insert unfulfilled order
          debug(`Importing unfulfilled order: ${orderId} (${orderNumber})`);
          
          const { data: insertedOrder, error: insertError } = await supabase
            .from("shopify_orders")
            .insert({
              shopify_order_id: orderId,
              shopify_order_number: orderNumber,
              created_at: shopifyOrder.created_at,
              customer_name: `${shopifyOrder.customer?.first_name || ''} ${shopifyOrder.customer?.last_name || ''}`.trim(),
              customer_email: shopifyOrder.customer?.email,
              customer_phone: shopifyOrder.customer?.phone,
              status: "unfulfilled",
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
              debug(`Error inserting line items for order ${orderId}: ${insertLineItemsError.message}`);
            }
          }
        }

        responseData.imported++;
      }
    } catch (error) {
      debug(`Error in Shopify API operations: ${error.message}`);
      throw error;
    }

    // STEP 3: Update last sync time in settings
    const { error: updateError } = await supabase.rpc("upsert_shopify_setting", {
      setting_name_param: "last_sync_time",
      setting_value_param: new Date().toISOString()
    });

    if (updateError) {
      debug(`Error updating last sync time: ${updateError.message}`);
    }

    responseData.success = true;
    debug("Shopify sync ALL completed successfully");
    debug(`Summary: Imported ${responseData.imported} orders, including ${responseData.fulfilled} fulfilled orders`);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    debug(`Error in Shopify sync ALL: ${error.message}`);
    responseData.error = error.message;
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Updated function to fetch ALL orders (not just unfulfilled)
async function fetchAllShopifyOrdersWithPagination(apiToken: string, apiEndpoint: string): Promise<{ orders: ShopifyOrder[], nextPageUrl: string | null }> {
  try {
    // Parse the base URL and add query parameters
    const url = new URL(apiEndpoint);
    
    // Don't filter by status - get ALL orders
    // Remove status parameter if it exists
    url.searchParams.delete('status');
    
    // Set limit to maximum allowed
    url.searchParams.set('limit', '250'); // Shopify API max
    
    // Set fields
    if (!url.searchParams.has('fields')) {
      url.searchParams.set('fields', 'id,name,created_at,customer,line_items,shipping_address,note,fulfillment_status,location_id');
    }
    
    console.log(`Fetching ALL orders from: ${url.toString()}`);
    
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
        return fetchAllShopifyOrdersWithPagination(apiToken, apiEndpoint);
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
    console.error(`Exception in fetchAllShopifyOrdersWithPagination:`, error);
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
