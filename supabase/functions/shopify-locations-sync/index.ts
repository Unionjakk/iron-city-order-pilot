
// Supabase Edge Function
// This function handles updating location info for existing line items in Shopify orders

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { RequestBody, SyncResponse, corsHeaders } from "./types.ts";
import { updateLineItemLocations, getLineItemsWithoutLocations, getSingleLineItemInfo, updateSingleLineItemLocation } from "./database.ts";
import { fetchOrdersWithLineItems, fetchSingleLineItem } from "./shopifyApi.ts";

serve(async (req) => {
  console.log("=== Shopify Locations Sync Function Started ===");
  console.log(`Request method: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
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
    
    // Check if we're handling a single line item update
    if (body.mode === "single" && body.orderId && body.lineItemId) {
      debug(`Starting single line item update for Order ID: ${body.orderId}, Line Item ID: ${body.lineItemId}`);
      
      // Get database info for this line item
      const dbLineItemInfo = await getSingleLineItemInfo(body.orderId, body.lineItemId, debug);
      
      if (!dbLineItemInfo) {
        debug(`No database record found for line item ID ${body.lineItemId}`);
        throw new Error(`Line item ${body.lineItemId} not found in the database`);
      }
      
      debug(`Found database record: ${JSON.stringify(dbLineItemInfo)}`);
      
      // Fetch the updated info from Shopify API
      const shopifyLineItem = await fetchSingleLineItem(apiToken, body.orderId, body.lineItemId, debug);
      
      if (!shopifyLineItem) {
        debug(`Line item ${body.lineItemId} not found in Shopify API response`);
        throw new Error(`Line item ${body.lineItemId} not found in Shopify API`);
      }
      
      debug(`Shopify API response for line item: ${JSON.stringify(shopifyLineItem)}`);
      
      // Perform the update
      const updateInfo = {
        id: dbLineItemInfo.id,
        location_id: shopifyLineItem.location_id || null,
        location_name: shopifyLineItem.location_name || null
      };
      
      debug(`Updating line item with: ${JSON.stringify(updateInfo)}`);
      
      const updated = await updateSingleLineItemLocation(updateInfo, debug);
      
      responseData.success = true;
      responseData.updated = updated ? 1 : 0;
      responseData.apiResponse = shopifyLineItem;
      
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    // Original bulk update logic
    debug("Starting location data import for all line items");

    // Get all line items for location update
    const lineItemsToUpdate = await getLineItemsWithoutLocations(debug);
    
    if (lineItemsToUpdate.length === 0) {
      debug("No line items found to update");
      responseData.success = true;
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    debug(`Found ${lineItemsToUpdate.length} line items to update with location data`);
    
    // Group line items by order ID to minimize API calls
    const lineItemsByOrderId = lineItemsToUpdate.reduce((acc: Record<string, any[]>, item) => {
      if (!acc[item.shopify_order_id]) {
        acc[item.shopify_order_id] = [];
      }
      acc[item.shopify_order_id].push(item);
      return acc;
    }, {});
    
    debug(`Grouped into ${Object.keys(lineItemsByOrderId).length} orders to fetch`);
    
    // Process orders in batches to respect rate limits
    const orderIds = Object.keys(lineItemsByOrderId);
    
    // Calculate total batches for progress reporting
    const batchSize = 5; // Process 5 orders at a time (increased from 3 for better performance) 
    const totalBatches = Math.ceil(orderIds.length / batchSize);
    debug(`Will process ${totalBatches} batches of orders, ${batchSize} orders per batch`);
    
    let processedOrders = 0;
    let processedLineItems = 0;
    let updatedLineItems = 0;
    
    // Process each batch of orders
    for (let i = 0; i < orderIds.length; i += batchSize) {
      const batchOrderIds = orderIds.slice(i, i + batchSize);
      const currentBatch = Math.floor(i/batchSize) + 1;
      debug(`Processing batch ${currentBatch} of ${totalBatches}, with ${batchOrderIds.length} orders`);
      debug(`Overall progress: ${Math.round((i / orderIds.length) * 100)}%`);
      
      // Create array to hold all line item updates for this batch
      const batchLineItemUpdates = [];
      
      // Process each order in the batch
      for (const orderId of batchOrderIds) {
        try {
          debug(`Fetching order ${orderId} from Shopify API`);
          const order = await fetchOrdersWithLineItems(apiToken, orderId, debug);
          
          if (!order || !order.line_items || !Array.isArray(order.line_items)) {
            debug(`No valid line items found for order ${orderId}`);
            continue;
          }
          
          debug(`Retrieved order ${orderId} with ${order.line_items.length} line items from Shopify`);
          
          // Map the line items to our database items
          const dbLineItems = lineItemsByOrderId[orderId];
          
          for (const dbLineItem of dbLineItems) {
            processedLineItems++;
            
            // Find matching line item in the Shopify response
            // Convert to string to ensure proper comparison
            const shopifyLineItem = order.line_items.find(item => 
              String(item.id) === String(dbLineItem.shopify_line_item_id)
            );
            
            if (shopifyLineItem) {
              debug(`Found matching line item ${shopifyLineItem.id} for order ${orderId}`);
              
              batchLineItemUpdates.push({
                id: dbLineItem.id,
                location_id: shopifyLineItem.location_id || null,
                location_name: shopifyLineItem.location_name || null
              });
            } else {
              debug(`No matching line item found for ${dbLineItem.shopify_line_item_id} in order ${orderId}`);
            }
          }
          
          processedOrders++;
        } catch (error: any) {
          debug(`Error processing order ${orderId}: ${error.message}`);
          // Continue with other orders even if one fails
        }
      }
      
      // Update location information for all line items in the batch
      if (batchLineItemUpdates.length > 0) {
        debug(`Sending update for ${batchLineItemUpdates.length} line items to database`);
        const updated = await updateLineItemLocations(batchLineItemUpdates, debug);
        updatedLineItems += updated;
        debug(`Successfully updated ${updated} line items for batch ${currentBatch}`);
      }
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < orderIds.length) {
        const delayMs = 1000; // 1 second delay between batches (reduced from 1.5s for better performance)
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
  } catch (error: any) {
    debug(`Error in Shopify locations sync: ${error.message}`);
    responseData.error = error.message;
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
