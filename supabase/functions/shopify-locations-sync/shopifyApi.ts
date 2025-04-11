
import { ShopifyOrder, ShopifyLineItem, corsHeaders } from "./types.ts";

/**
 * Fetches a specific order with line items from Shopify
 */
export async function fetchOrdersWithLineItems(
  apiToken: string,
  orderId: string,
  debug: (message: string) => void
): Promise<ShopifyOrder> {
  try {
    // Get the base API endpoint for orders
    const baseEndpoint = "https://opus-harley-davidson.myshopify.com/admin/api/2023-07";
    const url = `${baseEndpoint}/orders/${orderId}.json?fields=id,name,created_at,customer,line_items,shipping_address,note,fulfillment_status,fulfillments,locations`;
    
    debug(`Fetching order from Shopify API: ${url}`);
    debug(`Using API token: ${apiToken.substring(0, 4)}...${apiToken.substring(apiToken.length - 4)}`);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": apiToken,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
    });

    // Log response status and headers
    debug(`Response status: ${response.status} ${response.statusText}`);
    debug(`Response headers: ${JSON.stringify(Object.fromEntries([...response.headers]))}`);
    
    if (!response.ok) {
      let errorText = "";
      try {
        // Try to get the response as text
        errorText = await response.text();
        debug(`Shopify API error response body: ${errorText}`);
      } catch (e) {
        debug(`Could not read error response text: ${e.message}`);
      }
      
      if (response.status === 401) {
        throw new Error("Authentication failed. Your Shopify API token might be invalid or expired.");
      } else if (response.status === 404) {
        throw new Error(`Order ${orderId} not found in Shopify.`);
      } else if (response.status === 403) {
        throw new Error("Access forbidden. Your API token might not have the necessary permissions (read_locations and read_assigned_fulfillment_orders).");
      } else if (response.status === 429) {
        debug("Rate limit hit, waiting and retrying...");
        // Wait for 2 seconds and retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchOrdersWithLineItems(apiToken, orderId, debug);
      } else {
        throw new Error(`Shopify API error: ${response.status} - ${errorText || "Unknown error"}`);
      }
    }

    // Try to parse the JSON response
    let data;
    try {
      data = await response.json();
      debug(`Received JSON response from Shopify: ${JSON.stringify(data).substring(0, 200)}...`);
    } catch (e) {
      debug(`Error parsing JSON response: ${e.message}`);
      debug(`Raw response: ${await response.text()}`);
      throw new Error(`Failed to parse Shopify API response: ${e.message}`);
    }
    
    if (!data.order) {
      debug("Unexpected Shopify API response format: " + JSON.stringify(data));
      throw new Error("Received unexpected data format from Shopify API");
    }
    
    // Process the order to extract line items with location information
    const order = data.order;
    debug(`Processing order data: ${order.name} (#${order.order_number})`);
    
    // Process line items to extract location information if available
    if (order.line_items && Array.isArray(order.line_items)) {
      debug(`Found ${order.line_items.length} line items in the order`);
      
      // Check if fulfillments exist in the order data
      let locationName = null;
      let locationId = null;
      
      // Check if there are unfulfilled items with location info
      if (order.fulfillments && Array.isArray(order.fulfillments) && order.fulfillments.length > 0) {
        debug(`Order has ${order.fulfillments.length} fulfillments, extracting location data`);
        
        // Extract location from the first fulfillment
        const fulfillment = order.fulfillments[0];
        
        if (fulfillment.location_id) {
          locationId = String(fulfillment.location_id);
          
          // Try to get the location name from various sources
          if (fulfillment.location && fulfillment.location.name) {
            locationName = fulfillment.location.name;
            debug(`Found location name from fulfillment.location: ${locationName}`);
          } else {
            // Look for the location in the locations array if available
            if (order.locations && Array.isArray(order.locations)) {
              const locationInfo = order.locations.find(loc => String(loc.id) === locationId);
              if (locationInfo && locationInfo.name) {
                locationName = locationInfo.name;
                debug(`Found location name from locations array: ${locationName}`);
              }
            }
          }
        }
      } else {
        debug('No fulfillment data found, will try to get location directly from API');
      }
      
      // If we still don't have location info, try to fetch the fulfillments directly
      if (!locationName) {
        try {
          const fulfillmentsUrl = `${baseEndpoint}/orders/${orderId}/fulfillments.json`;
          debug(`Fetching fulfillments from separate endpoint: ${fulfillmentsUrl}`);
          
          const fulfillmentsResponse = await fetch(fulfillmentsUrl, {
            method: "GET",
            headers: {
              "X-Shopify-Access-Token": apiToken,
              "Content-Type": "application/json",
              "Accept": "application/json"
            }
          });
          
          if (fulfillmentsResponse.ok) {
            const fulfillmentData = await fulfillmentsResponse.json();
            
            if (fulfillmentData.fulfillments && Array.isArray(fulfillmentData.fulfillments) && fulfillmentData.fulfillments.length > 0) {
              debug(`Found ${fulfillmentData.fulfillments.length} fulfillments from direct API call`);
              
              // Extract location from the first fulfillment
              const fulfillment = fulfillmentData.fulfillments[0];
              
              if (fulfillment.location_id) {
                locationId = String(fulfillment.location_id);
                
                // Extract the location name if available
                if (fulfillment.location && fulfillment.location.name) {
                  locationName = fulfillment.location.name;
                  debug(`Found location name from direct fulfillment API: ${locationName}`);
                }
              }
            } else {
              debug('No fulfillments found in direct API call');
            }
          } else {
            debug(`Failed to fetch fulfillments: ${fulfillmentsResponse.status}`);
          }
        } catch (error) {
          debug(`Error fetching fulfillments directly: ${error.message}`);
        }
      }
      
      // Process line items with the location information
      order.line_items = order.line_items.map((item: any) => {
        // Ensure ID is always a string for consistent comparison
        item.id = String(item.id);
        
        // Set location information (from fulfillment or fallback)
        if (locationId && locationName) {
          debug(`Setting location info for item ${item.id}: ${locationName} (${locationId})`);
          item.location_id = locationId;
          item.location_name = locationName;
        } else {
          // If we still don't have location info, check if the item has origin_location
          if (item.origin_location) {
            debug(`Using origin_location for item ${item.id}: ${item.origin_location.name}`);
            item.location_id = String(item.origin_location.id);
            item.location_name = item.origin_location.name;
          } else {
            debug(`No location information found for item ${item.id}`);
            item.location_id = null;
            item.location_name = null;
          }
        }

        return item as ShopifyLineItem;
      });
    }
    
    debug(`Processed order ${orderId} with ${order.line_items?.length || 0} line items`);
    
    return order;
  } catch (error: any) {
    debug(`Exception in fetchOrdersWithLineItems: ${error.message}`);
    throw error;
  }
}

/**
 * Fetches a specific line item from Shopify by order ID and line item ID
 * This is a more direct and efficient way to get a single line item
 */
export async function fetchSingleLineItem(
  apiToken: string,
  orderId: string,
  lineItemId: string,
  debug: (message: string) => void
): Promise<ShopifyLineItem | null> {
  try {
    debug(`Fetching single line item: Order ID ${orderId}, Line Item ID ${lineItemId}`);
    
    // Get the complete order first - this ensures we have all the needed context
    const order = await fetchOrdersWithLineItems(apiToken, orderId, debug);
    
    if (!order.line_items || !Array.isArray(order.line_items)) {
      debug(`No line items found in order ${orderId}`);
      throw new Error(`No line items found in order ${orderId}`);
    }
    
    // Find the specific line item
    const lineItem = order.line_items.find(item => String(item.id) === String(lineItemId));
    
    if (!lineItem) {
      debug(`Line item ${lineItemId} not found in order ${orderId}`);
      throw new Error(`Line item ${lineItemId} not found in order ${orderId}`);
    }
    
    debug(`Successfully found line item ${lineItemId} with location: ${lineItem.location_name || 'none'}`);
    
    return lineItem;
  } catch (error: any) {
    debug(`Exception in fetchSingleLineItem: ${error.message}`);
    throw error;
  }
}

/**
 * Fetches all line items for an order and extracts location information
 * This allows updating all line items for an order at once
 */
export async function fetchAllLineItemsForOrder(
  apiToken: string,
  orderId: string,
  debug: (message: string) => void
): Promise<ShopifyLineItem[]> {
  try {
    debug(`Fetching all line items for order: ${orderId}`);
    
    // Use the existing function to get the complete order
    const order = await fetchOrdersWithLineItems(apiToken, orderId, debug);
    
    if (!order.line_items || !Array.isArray(order.line_items) || order.line_items.length === 0) {
      debug(`No line items found for order ${orderId}`);
      return [];
    }
    
    debug(`Retrieved ${order.line_items.length} line items for order ${orderId}`);
    
    // Extract location info from the order
    let locationData = null;
    
    // Try to get location from fulfillments first
    if (!locationData && order.line_items[0] && order.line_items[0].location_name) {
      locationData = {
        id: order.line_items[0].location_id,
        name: order.line_items[0].location_name
      };
      debug(`Using location from first line item: ${locationData.name}`);
    }
    
    // If we still don't have location data, make one more attempt with direct fulfillments API
    if (!locationData) {
      debug(`No location data found in order, making one final check with fulfillments API`);
      
      try {
        const baseEndpoint = "https://opus-harley-davidson.myshopify.com/admin/api/2023-07";
        const fulfillmentsUrl = `${baseEndpoint}/orders/${orderId}/fulfillments.json`;
        
        const fulfillmentsResponse = await fetch(fulfillmentsUrl, {
          method: "GET",
          headers: {
            "X-Shopify-Access-Token": apiToken,
            "Content-Type": "application/json",
            "Accept": "application/json"
          }
        });
        
        if (fulfillmentsResponse.ok) {
          const fulfillmentData = await fulfillmentsResponse.json();
          
          if (fulfillmentData.fulfillments && Array.isArray(fulfillmentData.fulfillments) && fulfillmentData.fulfillments.length > 0) {
            const fulfillment = fulfillmentData.fulfillments[0];
            
            if (fulfillment.location_id) {
              // Try to get location name if available
              if (fulfillment.location && fulfillment.location.name) {
                locationData = {
                  id: String(fulfillment.location_id),
                  name: fulfillment.location.name
                };
                debug(`Found location from fulfillments API: ${locationData.name}`);
              }
            }
          }
        }
      } catch (error) {
        debug(`Error in final location check: ${error.message}`);
      }
    }
    
    // Apply the location to all line items if we found it
    if (locationData) {
      debug(`Applying location "${locationData.name}" to all line items`);
      
      order.line_items = order.line_items.map(item => ({
        ...item,
        location_id: locationData.id,
        location_name: locationData.name
      }));
    }
    
    return order.line_items;
  } catch (error: any) {
    debug(`Error fetching all line items for order ${orderId}: ${error.message}`);
    throw error;
  }
}
