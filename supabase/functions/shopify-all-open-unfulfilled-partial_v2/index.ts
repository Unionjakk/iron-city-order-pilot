
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
    const endpointWithParams = `${apiEndpoint}?status=open&fulfillment_status=unfulfilled,partial`;
    console.log(`Using API endpoint: ${endpointWithParams}`);

    // Process all orders
    await processAllOrders(apiToken, endpointWithParams);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Import completed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
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

// Process all orders with pagination handling
async function processAllOrders(apiToken: string, apiEndpoint: string) {
  let currentEndpoint = apiEndpoint;
  
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
      
      // Process each order
      for (const order of data.orders) {
        await importOrder(order, order.id, order.order_number || order.name, console.log);
      }
      
      // Check for pagination
      const { nextPageUrl } = extractPaginationInfo(response);
      currentEndpoint = nextPageUrl;
      
      // If we have more pages, log the progress
      if (nextPageUrl) {
        console.log(`Moving to next page: ${nextPageUrl}`);
      }
    }
    
    console.log(`Import complete`);
  } catch (error) {
    console.error("Error processing orders:", error);
    throw error;
  }
}

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

// Helper functions for database operations
async function getShopifyApiEndpoint(debug: (message: string) => void): Promise<string> {
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
      // Default endpoint if none is found
      return "https://opus-harley-davidson.myshopify.com/admin/api/2023-07/orders";
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

async function importOrder(order: any, orderId: string, orderNumber: string, debug: (message: string) => void): Promise<boolean> {
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
          shopify_order_number: orderNumber,
          created_at: order.created_at,
          customer_name: customerName,
          customer_email: order.customer?.email || null,
          customer_phone: order.customer?.phone || null,
          status: order.fulfillment_status || "unfulfilled",
          items_count: order.line_items?.length || 0,
          imported_at: new Date().toISOString(),
          note: order.note || null,
          shipping_address: order.shipping_address || null,
          line_items: order.line_items || null
        },
        { onConflict: 'shopify_order_id', returning: 'minimal' }
      )
      .select('id');

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
      // Delete existing line items to avoid duplicates
      const { error: deleteLineItemsError } = await client
        .from("shopify_order_items")
        .delete()
        .eq("order_id", internalOrderId);

      if (deleteLineItemsError) {
        debug(`Error deleting existing line items for order ${orderId}: ${deleteLineItemsError.message}`);
      }
      
      for (const item of order.line_items) {
        // Ensure that required properties exist
        if (!item.id) {
          debug(`Skipping line item due to missing ID in order ${orderId}`);
          continue;
        }
        
        const { error: itemError } = await client
          .from('shopify_order_items')
          .upsert(
            {
              order_id: internalOrderId,
              shopify_line_item_id: item.id,
              sku: item.sku || '',
              title: item.title || 'N/A',
              quantity: item.quantity,
              price: item.price,
              location_id: item.location_id ? String(item.location_id) : null,
              location_name: item.location_name || null,
              product_id: item.product_id ? String(item.product_id) : null,
              variant_id: item.variant_id ? String(item.variant_id) : null,
              properties: item.properties || null
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
