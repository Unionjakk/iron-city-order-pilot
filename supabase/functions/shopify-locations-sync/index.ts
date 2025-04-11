
// Supabase Edge Function
// This function handles updating location info for existing line items in Shopify orders

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { RequestBody, SyncResponse, corsHeaders } from "./types.ts";
import { updateLineItemLocations, getLineItemsWithoutLocations } from "./database.ts";
import { fetchOrdersWithLineItems, fetchNextPage } from "./shopifyApi.ts";

serve(async (req) => {
  console.log("=== Shopify Locations Sync Function Started ===");
  console.log(`Request method: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize response data
  const responseData: SyncResponse = {
    success: false,
    error: null,
    updated: 0,
    debugMessages: []
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
    
    debug("Starting location data import for existing line items");

    // Get line items that don't have location information
    const lineItemsWithoutLocation = await getLineItemsWithoutLocations(debug);
    
    if (lineItemsWithoutLocation.length === 0) {
      debug("No line items without location data found");
      responseData.success = true;
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    debug(`Found ${lineItemsWithoutLocation.length} line items without location data`);
    
    // Group line items by order ID to minimize API calls
    const lineItemsByOrderId = lineItemsWithoutLocation.reduce((acc: Record<string, any[]>, item) => {
      if (!acc[item.shopify_order_id]) {
        acc[item.shopify_order_id] = [];
      }
      acc[item.shopify_order_id].push(item);
      return acc;
    }, {});
    
    debug(`Grouped into ${Object.keys(lineItemsByOrderId).length} orders to fetch`);
    
    // Process orders in batches to respect rate limits
    const orderIds = Object.keys(lineItemsByOrderId);
    const batchSize = 5; // Process 5 orders at a time
    
    let processedOrders = 0;
    let processedLineItems = 0;
    let updatedLineItems = 0;
    
    for (let i = 0; i < orderIds.length; i += batchSize) {
      const batchOrderIds = orderIds.slice(i, i + batchSize);
      debug(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(orderIds.length/batchSize)}, with ${batchOrderIds.length} orders`);
      
      // Process each order in the batch
      for (const orderId of batchOrderIds) {
        try {
          debug(`Fetching order ${orderId} from Shopify API`);
          const order = await fetchOrdersWithLineItems(apiToken, orderId, debug);
          
          if (!order || !order.line_items || !Array.isArray(order.line_items)) {
            debug(`No valid line items found for order ${orderId}`);
            continue;
          }
          
          debug(`Retrieved order ${orderId} with ${order.line_items.length} line items`);
          
          // Map the line items to our database items
          const lineItemUpdates = [];
          const dbLineItems = lineItemsByOrderId[orderId];
          
          for (const dbLineItem of dbLineItems) {
            processedLineItems++;
            
            // Find matching line item in the Shopify response
            const shopifyLineItem = order.line_items.find(item => 
              item.id === dbLineItem.shopify_line_item_id
            );
            
            if (shopifyLineItem) {
              debug(`Found matching line item ${shopifyLineItem.id} for order ${orderId}`);
              
              lineItemUpdates.push({
                id: dbLineItem.id,
                location_id: shopifyLineItem.location_id || null,
                location_name: shopifyLineItem.location_name || null
              });
            } else {
              debug(`No matching line item found for ${dbLineItem.shopify_line_item_id} in order ${orderId}`);
            }
          }
          
          // Update location information for line items
          if (lineItemUpdates.length > 0) {
            const updated = await updateLineItemLocations(lineItemUpdates, debug);
            updatedLineItems += updated;
            debug(`Updated ${updated} line items for order ${orderId}`);
          }
          
          processedOrders++;
        } catch (error) {
          debug(`Error processing order ${orderId}: ${error.message}`);
          // Continue with other orders even if one fails
        }
      }
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < orderIds.length) {
        const delayMs = 1500; // 1.5 second delay between batches (helps stay under 40 requests/minute)
        debug(`Waiting ${delayMs}ms before processing next batch to respect rate limits`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    debug(`Completed processing ${processedOrders} orders and ${processedLineItems} line items`);
    debug(`Successfully updated location data for ${updatedLineItems} line items`);
    
    responseData.success = true;
    responseData.updated = updatedLineItems;

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    debug(`Error in Shopify locations sync: ${error.message}`);
    responseData.error = error.message;
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
