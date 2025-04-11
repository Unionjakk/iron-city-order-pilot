
// Supabase Edge Function
// This function handles updating location info for existing line items in Shopify orders

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { RequestBody, SyncResponse, corsHeaders } from "./types.ts";
import { 
  updateLineItemLocations, 
  getLineItemsWithoutLocations, 
  getSingleLineItemInfo, 
  updateSingleLineItemLocation,
  updateAllLineItemsForOrder
} from "./database.ts";
import { 
  fetchOrdersWithLineItems, 
  fetchSingleLineItem,
  fetchAllLineItemsForOrder
} from "./shopifyApi.ts";
import { makeShopifyApiRequest, retryOnRateLimit } from "./apiUtils.ts";

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

    debug("API token validated successfully");
    
    // Check if we're requesting a list of all locations (for debugging)
    if (body.mode === "list_locations") {
      debug("Fetching all Shopify locations for debugging");
      
      try {
        const data = await retryOnRateLimit(
          () => makeShopifyApiRequest(apiToken!, "/locations.json", debug),
          debug
        );
        
        if (!data.locations || !Array.isArray(data.locations)) {
          debug("No locations found in Shopify");
          throw new Error("No locations found in Shopify API response");
        }
        
        debug(`Found ${data.locations.length} locations in Shopify`);
        
        responseData.success = true;
        responseData.locations = data.locations;
        
        return new Response(JSON.stringify(responseData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } catch (error: any) {
        debug(`Error fetching locations: ${error.message}`);
        responseData.error = `Error fetching locations: ${error.message}`;
        
        return new Response(JSON.stringify(responseData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    }
    
    // Check if we're handling a batch update for all line items for an order
    if (body.mode === "batch" && body.orderId) {
      debug(`Starting batch update for all line items in Order ID: ${body.orderId}`);
      
      try {
        // CRITICAL: First, try to get the "assigned_location" for this order via the assigned_fulfillment_orders endpoint
        debug("Checking for assigned locations via fulfillment orders endpoint");
        const fulfillmentOrdersData = await retryOnRateLimit(
          () => makeShopifyApiRequest(apiToken!, `/orders/${body.orderId}/fulfillment_orders.json`, debug),
          debug
        );
        
        debug(`RAW FULFILLMENT ORDERS DATA: ${JSON.stringify(fulfillmentOrdersData)}`);
        
        // Create a mapping of line item IDs to their assigned locations
        const lineItemLocationMap: Record<string, { id: string, name: string }> = {};
        
        if (fulfillmentOrdersData.fulfillment_orders && Array.isArray(fulfillmentOrdersData.fulfillment_orders)) {
          debug(`Found ${fulfillmentOrdersData.fulfillment_orders.length} fulfillment orders`);
          
          // Process each fulfillment order to extract locations for line items
          for (const fulfillmentOrder of fulfillmentOrdersData.fulfillment_orders) {
            if (fulfillmentOrder.assigned_location_id && fulfillmentOrder.line_items) {
              const locationId = String(fulfillmentOrder.assigned_location_id);
              let locationName = "Unknown Location";
              
              // Try to get location name if available
              if (fulfillmentOrder.assigned_location && fulfillmentOrder.assigned_location.name) {
                locationName = fulfillmentOrder.assigned_location.name;
              }
              
              debug(`Fulfillment order assigned to location: ${locationName} (${locationId})`);
              
              // Map each line item in this fulfillment order to the location
              for (const lineItem of fulfillmentOrder.line_items) {
                if (lineItem.line_item_id) {
                  const lineItemId = String(lineItem.line_item_id);
                  lineItemLocationMap[lineItemId] = { 
                    id: locationId, 
                    name: locationName 
                  };
                  debug(`Line item ${lineItemId} is assigned to ${locationName} (${locationId})`);
                }
              }
            }
          }
        } else {
          debug("No fulfillment orders found, will need to check inventory locations");
        }
        
        // If we didn't find location info, we still need to fetch line items to update
        // Fetch all line items for the order from Shopify
        const lineItems = await fetchAllLineItemsForOrder(apiToken!, body.orderId, debug);
        
        if (!lineItems || lineItems.length === 0) {
          debug(`No line items found for order ${body.orderId} in Shopify API`);
          throw new Error(`No line items found for order ${body.orderId}`);
        }
        
        debug(`Retrieved ${lineItems.length} line items from Shopify for order ${body.orderId}`);
        
        // Apply location information from our map to the line items
        for (const item of lineItems) {
          const lineItemId = String(item.id);
          if (lineItemLocationMap[lineItemId]) {
            item.location_id = lineItemLocationMap[lineItemId].id;
            item.location_name = lineItemLocationMap[lineItemId].name;
            debug(`Applied location ${item.location_name} to line item ${lineItemId}`);
          } else {
            debug(`No location mapping found for line item ${lineItemId}`);
            
            // If location is missing, we could try additional methods to find location info
            // For now, we'll leave these fields as null and let the front end know
            item.location_id = null;
            item.location_name = null;
          }
        }
        
        // Update all line items in the database
        const updatedCount = await updateAllLineItemsForOrder(body.orderId, lineItems, debug);
        
        responseData.success = true;
        responseData.updated = updatedCount;
        responseData.totalItems = lineItems.length;
        
        return new Response(JSON.stringify(responseData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } catch (error: any) {
        debug(`Error in batch line items update: ${error.message}`);
        responseData.error = `Error updating line items: ${error.message}`;
        
        return new Response(JSON.stringify(responseData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    }
    
    // Check if we're handling a single line item update
    if (body.mode === "single" && body.orderId && body.lineItemId) {
      debug(`Starting single line item update for Order ID: ${body.orderId}, Line Item ID: ${body.lineItemId}`);
      
      try {
        // Get database info for this line item
        const dbLineItemInfo = await getSingleLineItemInfo(body.orderId, body.lineItemId, debug);
        
        if (!dbLineItemInfo) {
          debug(`No database record found for line item ID ${body.lineItemId}`);
          throw new Error(`Line item ${body.lineItemId} not found in the database`);
        }
        
        debug(`Found database record: ${JSON.stringify(dbLineItemInfo)}`);
        
        // Try to get location from fulfillment orders - THIS IS THE KEY ADDITION
        debug("Checking for assigned location via fulfillment orders endpoint");
        let location = { id: null, name: null };
        
        try {
          const fulfillmentOrdersData = await retryOnRateLimit(
            () => makeShopifyApiRequest(apiToken!, `/orders/${body.orderId}/fulfillment_orders.json`, debug),
            debug
          );
          
          debug(`RAW FULFILLMENT ORDERS DATA FOR SINGLE ITEM: ${JSON.stringify(fulfillmentOrdersData)}`);
          
          if (fulfillmentOrdersData.fulfillment_orders && Array.isArray(fulfillmentOrdersData.fulfillment_orders)) {
            for (const fulfillmentOrder of fulfillmentOrdersData.fulfillment_orders) {
              if (fulfillmentOrder.assigned_location_id && fulfillmentOrder.line_items) {
                for (const lineItem of fulfillmentOrder.line_items) {
                  if (lineItem.line_item_id === body.lineItemId) {
                    location.id = String(fulfillmentOrder.assigned_location_id);
                    
                    if (fulfillmentOrder.assigned_location && fulfillmentOrder.assigned_location.name) {
                      location.name = fulfillmentOrder.assigned_location.name;
                    }
                    
                    debug(`Found location for line item ${body.lineItemId}: ${location.name} (${location.id})`);
                    break;
                  }
                }
              }
              
              if (location.id) break;
            }
          }
        } catch (err) {
          debug(`Error checking fulfillment orders: ${err.message}`);
          // Continue with other methods to get location
        }
        
        // If location not found from fulfillment orders, use the standard method
        if (!location.id) {
          debug("No location found in fulfillment orders, trying standard method");
          
          // Fetch the updated info from Shopify API
          const shopifyLineItem = await fetchSingleLineItem(apiToken!, body.orderId, body.lineItemId, debug);
          
          if (!shopifyLineItem) {
            debug(`Line item ${body.lineItemId} not found in Shopify API response`);
            throw new Error(`Line item ${body.lineItemId} not found in Shopify API`);
          }
          
          debug(`Shopify API response for line item: ${JSON.stringify(shopifyLineItem)}`);
          
          if (shopifyLineItem.location_id) {
            location.id = shopifyLineItem.location_id;
            location.name = shopifyLineItem.location_name || "Unknown Location";
          }
        }
        
        // Perform the update
        const updateInfo = {
          id: dbLineItemInfo.id,
          location_id: location.id,
          location_name: location.name
        };
        
        debug(`Updating line item with: ${JSON.stringify(updateInfo)}`);
        
        const updated = await updateSingleLineItemLocation(updateInfo, debug);
        
        responseData.success = true;
        responseData.updated = updated ? 1 : 0;
        responseData.apiResponse = { location };
        
        return new Response(JSON.stringify(responseData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } catch (error: any) {
        debug(`Error in single line item update: ${error.message}`);
        responseData.error = `Error updating single line item: ${error.message}`;
        
        return new Response(JSON.stringify(responseData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
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
    const batchSize = 5; // Process 5 orders at a time
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
          // NEW: First try to get locations from fulfillment orders
          let lineItemLocationMap: Record<string, { id: string, name: string }> = {};
          
          try {
            const fulfillmentOrdersData = await retryOnRateLimit(
              () => makeShopifyApiRequest(apiToken!, `/orders/${orderId}/fulfillment_orders.json`, debug),
              debug
            );
            
            if (fulfillmentOrdersData.fulfillment_orders && Array.isArray(fulfillmentOrdersData.fulfillment_orders)) {
              debug(`Found ${fulfillmentOrdersData.fulfillment_orders.length} fulfillment orders for order ${orderId}`);
              
              for (const fulfillmentOrder of fulfillmentOrdersData.fulfillment_orders) {
                if (fulfillmentOrder.assigned_location_id && fulfillmentOrder.line_items) {
                  const locationId = String(fulfillmentOrder.assigned_location_id);
                  let locationName = "Unknown Location";
                  
                  if (fulfillmentOrder.assigned_location && fulfillmentOrder.assigned_location.name) {
                    locationName = fulfillmentOrder.assigned_location.name;
                  }
                  
                  for (const lineItem of fulfillmentOrder.line_items) {
                    if (lineItem.line_item_id) {
                      const lineItemId = String(lineItem.line_item_id);
                      lineItemLocationMap[lineItemId] = { id: locationId, name: locationName };
                    }
                  }
                }
              }
            }
          } catch (err) {
            debug(`Error getting fulfillment orders for ${orderId}: ${err.message}`);
            // Continue with standard method
          }
          
          // Standard method as fallback
          debug(`Fetching order ${orderId} from Shopify API`);
          const order = await fetchOrdersWithLineItems(apiToken!, orderId, debug);
          
          if (!order || !order.line_items || !Array.isArray(order.line_items)) {
            debug(`No valid line items found for order ${orderId}`);
            continue;
          }
          
          debug(`Retrieved order ${orderId} with ${order.line_items.length} line items from Shopify`);
          
          // Map the line items to our database items
          const dbLineItems = lineItemsByOrderId[orderId];
          
          for (const dbLineItem of dbLineItems) {
            processedLineItems++;
            const lineItemId = String(dbLineItem.shopify_line_item_id);
            
            // First check our location map from fulfillment orders
            if (lineItemLocationMap[lineItemId]) {
              batchLineItemUpdates.push({
                id: dbLineItem.id,
                location_id: lineItemLocationMap[lineItemId].id,
                location_name: lineItemLocationMap[lineItemId].name
              });
              debug(`Using location from fulfillment orders for line item ${lineItemId}: ${lineItemLocationMap[lineItemId].name}`);
              continue;
            }
            
            // Find matching line item in the Shopify response as fallback
            const shopifyLineItem = order.line_items.find(item => 
              String(item.id) === lineItemId
            );
            
            if (shopifyLineItem) {
              debug(`Found matching line item ${shopifyLineItem.id} for order ${orderId}`);
              
              batchLineItemUpdates.push({
                id: dbLineItem.id,
                location_id: shopifyLineItem.location_id || null,
                location_name: shopifyLineItem.location_name || null
              });
            } else {
              debug(`No matching line item found for ${lineItemId} in order ${orderId}`);
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
        const delayMs = 1000; // 1 second delay between batches
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
