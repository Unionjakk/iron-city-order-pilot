
// Supabase Edge Function
// This function imports ALL open unfulfilled and partially fulfilled orders from Shopify
// With proper pagination and rate limiting (40 requests per minute)

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Types for API responses and function configuration
interface ImportResponse {
  success: boolean;
  error?: string;
  message?: string;
  imported: {
    orders: number;
    lineItems: number;
  };
  debugMessages: string[];
}

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting parameters
const RATE_LIMIT = 40; // 40 requests per minute
const RATE_WINDOW = 60000; // 1 minute in milliseconds
const BATCH_SIZE = 5; // Process 5 orders at a time

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize response
  const responseData: ImportResponse = {
    success: false,
    imported: {
      orders: 0,
      lineItems: 0
    },
    debugMessages: []
  };

  // Debug logging helper
  const debug = (message: string) => {
    console.log(message);
    responseData.debugMessages.push(message);
  };

  try {
    debug("=== Starting Import of OPEN (Not Archived) Unfulfilled and Partially Fulfilled Orders ===");
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body for API token or get it from the database
    let apiToken: string;
    try {
      const body = await req.json();
      apiToken = body.apiToken;
      
      if (!apiToken) {
        debug("No API token provided in request, trying to get from database");
        const { data: tokenData, error: tokenError } = await supabase.rpc("get_shopify_setting", { 
          setting_name_param: "shopify_token" 
        });
        
        if (tokenError || !tokenData) {
          throw new Error("Failed to retrieve API token from database");
        }
        
        apiToken = tokenData;
      }
    } catch (error) {
      debug("Error parsing request or retrieving token: " + error.message);
      throw new Error("No API token available. Please configure token in settings.");
    }

    // Get the Shopify API endpoint from database
    const { data: apiEndpoint, error: endpointError } = await supabase.rpc("get_shopify_setting", {
      setting_name_param: "shopify_api_endpoint"
    });

    if (endpointError || !apiEndpoint) {
      debug(`Error retrieving API endpoint: ${endpointError?.message || 'Not found'}`);
      throw new Error("Failed to retrieve Shopify API endpoint");
    }

    // Build the filtered API endpoint for OPEN unfulfilled and partially fulfilled orders
    // Important: Add status=open to filter out archived orders
    const filters = "status=open&fulfillment_status=unfulfilled,partial&limit=50";
    const filteredApiEndpoint = apiEndpoint.includes('?') 
      ? `${apiEndpoint}&${filters}`
      : `${apiEndpoint}?${filters}`;
    
    debug(`Using filtered API endpoint: ${filteredApiEndpoint}`);

    // Fetch orders with pagination
    let nextPageUrl: string | null = filteredApiEndpoint;
    let totalOrdersImported = 0;
    let totalLineItemsImported = 0;
    let requestsThisMinute = 0;
    let minuteStartTime = Date.now();
    
    // Update status to importing
    await supabase.rpc("upsert_shopify_setting", {
      setting_name_param: "shopify_import_status",
      setting_value_param: "importing"
    });

    // Loop through all pages of results
    while (nextPageUrl) {
      // Rate limiting - enforce Shopify's limit of 40 requests per minute
      const currentTime = Date.now();
      if (currentTime - minuteStartTime >= RATE_WINDOW) {
        // Reset the counter for a new minute
        requestsThisMinute = 0;
        minuteStartTime = currentTime;
      }
      
      if (requestsThisMinute >= RATE_LIMIT) {
        const waitTime = RATE_WINDOW - (currentTime - minuteStartTime);
        debug(`Rate limit reached. Waiting ${waitTime}ms before next request`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Reset for new minute
        requestsThisMinute = 0;
        minuteStartTime = Date.now();
      }
      
      // Make the API request
      debug(`Fetching orders from: ${nextPageUrl}`);
      requestsThisMinute++;
      
      const response = await fetch(nextPageUrl, {
        headers: {
          'X-Shopify-Access-Token': apiToken,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        debug(`Shopify API Error: ${response.status} - ${errorText}`);
        
        // Handle rate limiting from Shopify
        if (response.status === 429) {
          debug("Rate limit exceeded. Waiting before retrying...");
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue; // Retry the same URL
        }
        
        throw new Error(`Shopify API returned error: ${response.status}`);
      }
      
      // Parse the response
      const data = await response.json();
      
      if (!data.orders || !Array.isArray(data.orders)) {
        debug("Unexpected response format from Shopify API");
        throw new Error("Invalid data format received from Shopify API");
      }
      
      // Log the number of orders received
      debug(`Received ${data.orders.length} orders from Shopify API`);
      
      // Double check to ensure we only process OPEN unfulfilled or partially fulfilled orders
      const ordersToProcess = data.orders.filter(order => {
        // Check if order is cancelled or closed (should be filtered by API, but double check)
        const isCancelled = order.cancelled_at !== null && order.cancelled_at !== undefined;
        const isClosed = order.closed_at !== null && order.closed_at !== undefined;
        const isArchived = order.status === 'archived';
        
        // Only include orders that are not cancelled/closed/archived AND (unfulfilled OR partially fulfilled)
        const fulfillmentStatus = order.fulfillment_status || 'unfulfilled';
        const isValidStatus = fulfillmentStatus === 'unfulfilled' || fulfillmentStatus === 'partial';
        
        return !isCancelled && !isClosed && !isArchived && isValidStatus;
      });
      
      debug(`After filtering, ${ordersToProcess.length} open orders match criteria`);
      
      // Process orders in batches
      for (let i = 0; i < ordersToProcess.length; i += BATCH_SIZE) {
        const batch = ordersToProcess.slice(i, i + BATCH_SIZE);
        debug(`Processing batch of ${batch.length} orders (${i+1} to ${Math.min(i+BATCH_SIZE, ordersToProcess.length)})`);
        
        for (const order of batch) {
          try {
            // Basic validation
            if (!order.id || !order.order_number) {
              debug(`Skipping order due to missing ID or order number: ${JSON.stringify(order.id)}`);
              continue;
            }
            
            const orderId = String(order.id);
            const orderNumber = order.order_number || order.name || '';
            
            // Import the order
            debug(`Importing order: ${orderId} (#${orderNumber})`);
            
            // Prepare customer data
            const customerName = order.customer 
              ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() 
              : 'Unknown Customer';
              
            const customerEmail = order.customer?.email || null;
            const customerPhone = order.customer?.phone || null;
            
            // Check if order already exists
            const { data: existingOrder, error: checkError } = await supabase
              .from("shopify_orders")
              .select("id")
              .eq("shopify_order_id", orderId)
              .maybeSingle();

            if (checkError) {
              debug(`Error checking existing order ${orderId}: ${checkError.message}`);
              continue;
            }

            let orderDbId: string;

            if (existingOrder) {
              debug(`Order ${orderId} (#${orderNumber}) already exists - updating`);
              
              // Update existing order
              const { error: updateError } = await supabase
                .from("shopify_orders")
                .update({
                  status: order.fulfillment_status || "unfulfilled",
                  imported_at: new Date().toISOString(),
                  customer_name: customerName,
                  customer_email: customerEmail,
                  customer_phone: customerPhone,
                  shipping_address: order.shipping_address || null,
                  note: order.note || null,
                  line_items: order.line_items || null
                })
                .eq("id", existingOrder.id);

              if (updateError) {
                debug(`Error updating order ${orderId}: ${updateError.message}`);
                continue;
              }
              
              orderDbId = existingOrder.id;

              // Delete existing line items to avoid duplicates
              const { error: deleteLineItemsError } = await supabase
                .from("shopify_order_items")
                .delete()
                .eq("order_id", orderDbId);

              if (deleteLineItemsError) {
                debug(`Error deleting existing line items for order ${orderId}: ${deleteLineItemsError.message}`);
              }
            } else {
              // Insert new order
              const { data: insertedOrder, error: insertError } = await supabase
                .from("shopify_orders")
                .insert({
                  shopify_order_id: orderId,
                  shopify_order_number: orderNumber.toString(),
                  created_at: order.created_at,
                  customer_name: customerName,
                  customer_email: customerEmail, 
                  customer_phone: customerPhone,
                  status: order.fulfillment_status || "unfulfilled",
                  items_count: order.line_items?.length || 0,
                  imported_at: new Date().toISOString(),
                  note: order.note || null,
                  shipping_address: order.shipping_address || null,
                  line_items: order.line_items || null
                })
                .select()
                .single();

              if (insertError) {
                debug(`Error inserting order ${orderId}: ${insertError.message}`);
                continue;
              }

              if (!insertedOrder) {
                debug(`Error: No order ID returned after inserting order ${orderId}`);
                continue;
              }

              orderDbId = insertedOrder.id;
              totalOrdersImported++;
            }

            // Process line items if available
            if (order.line_items && Array.isArray(order.line_items) && order.line_items.length > 0) {
              debug(`Processing ${order.line_items.length} line items for order ${orderId}`);
              
              for (const item of order.line_items) {
                // Ensure IDs are stored as strings
                const shopifyLineItemId = String(item.id || `default-${Math.random().toString(36).substring(2, 15)}`);
                
                const { error: insertLineItemError } = await supabase
                  .from("shopify_order_items")
                  .insert({
                    order_id: orderDbId,
                    shopify_line_item_id: shopifyLineItemId,
                    title: item.title || "Unknown Product",
                    sku: item.sku || "",
                    quantity: item.quantity || 1,
                    price: item.price || "0.00",
                    product_id: item.product_id ? String(item.product_id) : "",
                    variant_id: item.variant_id ? String(item.variant_id) : "",
                    properties: item.properties || null,
                    location_id: item.location_id ? String(item.location_id) : null,
                    location_name: item.location_name || null
                  });
                  
                if (insertLineItemError) {
                  debug(`Error inserting line item for order ${orderId}: ${insertLineItemError.message}`);
                } else {
                  totalLineItemsImported++;
                }
              }
            } else {
              debug(`Order ${orderId} has no line items`);
            }
            
            debug(`Successfully imported order ${orderId}`);
          } catch (orderError) {
            debug(`Error processing order: ${orderError.message}`);
          }
        }
        
        // Short delay between batches to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Check for pagination - Link header contains next page URL
      const linkHeader = response.headers.get('Link');
      nextPageUrl = null;
      
      if (linkHeader) {
        const links = linkHeader.split(',');
        for (const link of links) {
          const match = link.match(/<([^>]+)>;\s*rel="([^"]+)"/);
          if (match && match[2] === 'next') {
            nextPageUrl = match[1];
            debug(`Found next page URL: ${nextPageUrl}`);
            break;
          }
        }
      }
      
      // Update import progress in the database
      await supabase.rpc("upsert_shopify_setting", {
        setting_name_param: "shopify_orders_imported",
        setting_value_param: totalOrdersImported.toString()
      });
      
      await supabase.rpc("upsert_shopify_setting", {
        setting_name_param: "shopify_orders_lines_imported",
        setting_value_param: totalLineItemsImported.toString()
      });
      
      debug(`Progress: Imported ${totalOrdersImported} orders and ${totalLineItemsImported} line items so far`);
    }
    
    // All pages processed - update final counts and status
    await supabase.rpc("upsert_shopify_setting", {
      setting_name_param: "shopify_orders_imported",
      setting_value_param: totalOrdersImported.toString()
    });
    
    await supabase.rpc("upsert_shopify_setting", {
      setting_name_param: "shopify_orders_lines_imported",
      setting_value_param: totalLineItemsImported.toString()
    });
    
    // Update last sync time
    await supabase.rpc("upsert_shopify_setting", {
      setting_name_param: "last_sync_time",
      setting_value_param: new Date().toISOString()
    });
    
    // Update status to complete
    await supabase.rpc("upsert_shopify_setting", {
      setting_name_param: "shopify_import_status",
      setting_value_param: "complete"
    });
    
    // Prepare successful response
    responseData.success = true;
    responseData.imported.orders = totalOrdersImported;
    responseData.imported.lineItems = totalLineItemsImported;
    responseData.message = `Successfully imported ${totalOrdersImported} open orders with ${totalLineItemsImported} line items`;
    
    debug("=== Import Complete ===");
    debug(responseData.message);
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
  } catch (error) {
    // Handle any unexpected errors
    debug(`Error in import process: ${error.message}`);
    if (error.stack) {
      debug(`Stack trace: ${error.stack}`);
    }
    
    responseData.error = error.message;
    
    // Update status to error
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.rpc("upsert_shopify_setting", {
        setting_name_param: "shopify_import_status",
        setting_value_param: "error"
      });
    }
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
