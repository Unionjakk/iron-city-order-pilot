
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { extractPaginationInfo } from './paginationUtils.ts';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handler for the edge function
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body to get the API token
    const { apiToken } = await req.json();
    
    if (!apiToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'API token is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get the Shopify API endpoint from the database
    const apiEndpoint = await getShopifyApiEndpoint(console.log);
    
    // Add query parameters for open, unfulfilled/partial orders only
    // Also specify the fields we want to retrieve, matching the single order import
    const endpointWithParams = `${apiEndpoint}?status=open&fulfillment_status=unfulfilled,partial&fields=id,order_number,name,created_at,fulfillment_status,customer,line_items,shipping_address,note,email,phone`;
    console.log(`Using API endpoint: ${endpointWithParams}`);

    // Process all orders
    let currentEndpoint = endpointWithParams;
    let totalOrders = 0;
    
    try {
      while (currentEndpoint) {
        console.log(`Fetching orders from: ${currentEndpoint}`);
        
        // Use waitForRateLimit to respect Shopify's rate limits
        await waitForRateLimit();
        
        const response = await fetch(currentEndpoint, {
          headers: {
            "X-Shopify-Access-Token": apiToken,
            "Content-Type": "application/json",
          },
        });
        
        if (!response.ok) {
          const error = await response.text();
          console.error(`Shopify API error: ${response.status} ${response.statusText}`, error);
          throw new Error(`Shopify API returned error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.orders || !Array.isArray(data.orders)) {
          console.error("Unexpected Shopify API response format:", data);
          throw new Error("Received unexpected data format from Shopify API");
        }
        
        // Process each order - mirroring single order import logic
        for (const order of data.orders) {
          console.log(`Processing order ${order.id} (${order.order_number || order.name})`);
          
          // Prepare customer data - use safe defaults if missing
          const customerName = order.customer 
            ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() 
            : 'Unknown Customer';
            
          const customerEmail = order.customer 
            ? order.customer.email || null
            : (order.email || null);
            
          const customerPhone = order.customer 
            ? order.customer.phone || null
            : (order.phone || null);

          // Check if order already exists
          const { data: existingOrder, error: checkError } = await supabase
            .from("shopify_orders")
            .select("id")
            .eq("shopify_order_id", String(order.id))
            .maybeSingle();

          if (checkError) {
            console.error(`Error checking existing order ${order.id}: ${checkError.message}`);
            continue;
          }

          let orderDbId: string;

          if (existingOrder) {
            console.log(`Order ${order.id} already exists - updating`);
            
            // Update existing order with all customer data
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
              console.error(`Error updating order ${order.id}: ${updateError.message}`);
              continue;
            }
            
            orderDbId = existingOrder.id;

            // Delete existing line items to avoid duplicates
            const { error: deleteLineItemsError } = await supabase
              .from("shopify_order_items")
              .delete()
              .eq("order_id", orderDbId);

            if (deleteLineItemsError) {
              console.error(`Error deleting existing line items for order ${order.id}: ${deleteLineItemsError.message}`);
            }
          } else {
            // Insert new order with all customer data
            const { data: insertedOrder, error: insertError } = await supabase
              .from("shopify_orders")
              .insert({
                shopify_order_id: String(order.id),
                shopify_order_number: order.order_number || order.name,
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
              console.error(`Error inserting order ${order.id}: ${insertError.message}`);
              continue;
            }

            if (!insertedOrder) {
              console.error(`Error: No order ID returned after inserting order ${order.id}`);
              continue;
            }

            orderDbId = insertedOrder.id;
          }

          // Process line items exactly like single order import
          if (order.line_items && Array.isArray(order.line_items) && order.line_items.length > 0) {
            console.log(`Processing ${order.line_items.length} line items for order ${order.id}`);
            
            for (const item of order.line_items) {
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
                console.error(`Error inserting line item for order ${order.id}: ${insertLineItemError.message}`);
              } else {
                console.log(`Successfully inserted line item ${shopifyLineItemId} for order ${order.id}`);
              }
            }
          } else {
            console.log(`Warning: Order ${order.id} has no line items`);
          }

          // Verify line items were created
          const { count, error: countError } = await supabase
            .from("shopify_order_items")
            .select("*", { count: 'exact', head: true })
            .eq("order_id", orderDbId);
            
          if (countError) {
            console.error(`Error verifying line items for order ${order.id}: ${countError.message}`);
          } else if (!count || count === 0) {
            console.error(`WARNING: No line items were created for order ${order.id}`);
          } else {
            console.log(`Verified ${count} line items for order ${order.id}`);
          }

          totalOrders++;
        }
        
        // Check for pagination
        const { nextPageUrl } = extractPaginationInfo(response);
        currentEndpoint = nextPageUrl;
        
        if (nextPageUrl) {
          console.log(`Moving to next page: ${nextPageUrl}`);
        }
      }
      
      console.log(`Import complete. Total orders processed: ${totalOrders}`);
      
    } catch (error) {
      console.error("Error processing orders:", error);
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully processed ${totalOrders} orders`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in shopify-all-open-unfulfilled-partial_v2 function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unknown error occurred' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Wait to respect Shopify's rate limits (40 requests per minute)
let lastRequestTime = 0;
const minTimeBetweenRequests = 1500; // 1.5 seconds between requests = 40 per minute

async function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < minTimeBetweenRequests) {
    const waitTime = minTimeBetweenRequests - timeSinceLastRequest;
    console.log(`Rate limit: Waiting ${waitTime}ms before next request`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

async function getShopifyApiEndpoint(debug: (message: string) => void): Promise<string> {
  try {
    debug("Getting Shopify API endpoint from database...");
    
    const { data: endpointData, error: endpointError } = await supabase.rpc("get_shopify_setting", {
      setting_name_param: "shopify_api_endpoint"
    });

    if (endpointError) {
      debug(`Failed to retrieve API endpoint: ${endpointError.message}`);
      throw new Error(`Failed to retrieve API endpoint: ${endpointError.message}`);
    }

    if (!endpointData || typeof endpointData !== 'string') {
      debug("No API endpoint found in database");
      return "https://opus-harley-davidson.myshopify.com/admin/api/2023-07/orders.json";
    }
    
    // Return endpoint without any query parameters (we'll add them later)
    const baseEndpoint = endpointData.split('?')[0];
    debug(`Shopify API endpoint: ${baseEndpoint}`);
    return baseEndpoint;
  } catch (error) {
    debug(`Error getting Shopify API endpoint: ${error.message}`);
    throw error;
  }
}
