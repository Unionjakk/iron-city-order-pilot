
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
      
      // Extract location information from fulfillments if available
      const locationMap = new Map();
      
      // First, check if there are fulfillments and extract location info
      if (order.fulfillments && Array.isArray(order.fulfillments) && order.fulfillments.length > 0) {
        debug(`Order has ${order.fulfillments.length} fulfillments, extracting location data`);
        
        // Get the primary location from the first fulfillment if available
        const primaryFulfillment = order.fulfillments[0];
        const primaryLocationId = primaryFulfillment.location_id ? String(primaryFulfillment.location_id) : null;
        let primaryLocationName = null;
        
        // Try to get location name from various sources
        if (primaryFulfillment.location && primaryFulfillment.location.name) {
          primaryLocationName = primaryFulfillment.location.name;
          debug(`Found primary location name from fulfillment.location: ${primaryLocationName}`);
        } else if (primaryLocationId) {
          // If we have locations array, try to find the location name
          if (order.locations && Array.isArray(order.locations)) {
            const locationInfo = order.locations.find(loc => String(loc.id) === primaryLocationId);
            if (locationInfo && locationInfo.name) {
              primaryLocationName = locationInfo.name;
              debug(`Found primary location name from locations array: ${primaryLocationName}`);
            }
          }
        }
        
        // Map line items to their location using the fulfillment line items
        for (const fulfillment of order.fulfillments) {
          if (fulfillment.line_items && Array.isArray(fulfillment.line_items)) {
            const locationId = fulfillment.location_id ? String(fulfillment.location_id) : null;
            let locationName = null;
            
            // Try to get location name
            if (fulfillment.location && fulfillment.location.name) {
              locationName = fulfillment.location.name;
            } else if (locationId && order.locations && Array.isArray(order.locations)) {
              const locationInfo = order.locations.find(loc => String(loc.id) === locationId);
              if (locationInfo && locationInfo.name) {
                locationName = locationInfo.name;
              }
            }
            
            // Map each line item to its location
            for (const lineItem of fulfillment.line_items) {
              locationMap.set(String(lineItem.id), { 
                location_id: locationId,
                location_name: locationName
              });
              debug(`Mapped line item ${lineItem.id} to location "${locationName}" (ID: ${locationId})`);
            }
          }
        }
        
        // Set default location for all items if we have a primary location
        if (primaryLocationId && primaryLocationName) {
          debug(`Setting default location for all items: "${primaryLocationName}" (ID: ${primaryLocationId})`);
          order.default_location_id = primaryLocationId;
          order.default_location_name = primaryLocationName;
        }
      } else {
        debug('No fulfillment data found, will try other location sources');
      }
      
      // Process each line item
      order.line_items = order.line_items.map((item: any) => {
        // Ensure ID is always a string for consistent comparison
        item.id = String(item.id);
        
        // Check if we have location data from fulfillments
        const fulfillmentLocation = locationMap.get(item.id);
        if (fulfillmentLocation) {
          debug(`Using fulfillment location for item ${item.id}: "${fulfillmentLocation.location_name}"`);
          item.location_id = fulfillmentLocation.location_id;
          item.location_name = fulfillmentLocation.location_name;
        } 
        // Extract location information from the line item if available
        else if (item.origin_location) {
          debug(`Item ${item.id} has origin_location: ${JSON.stringify(item.origin_location)}`);
          item.location_id = String(item.origin_location.id);
          item.location_name = item.origin_location.name;
        } 
        // If no location info found but we have a default, use that
        else if (order.default_location_id && order.default_location_name) {
          debug(`Using default location for item ${item.id}: "${order.default_location_name}"`);
          item.location_id = order.default_location_id;
          item.location_name = order.default_location_name;
        }
        // No location information available
        else {
          debug(`Item ${item.id} has no location data available`);
          item.location_id = null;
          item.location_name = null;
        }

        return item as ShopifyLineItem;
      });
    }
    
    debug(`Processed order ${orderId} with ${order.line_items?.length || 0} line items`);
    
    // If we still don't have locations for any items, check if we need to make an additional API call
    // to get fulfillment information directly
    if (order.line_items && order.line_items.some(item => !item.location_name)) {
      debug(`Some line items are missing location information, checking for fulfillments directly`);
      
      try {
        const fulfillmentUrl = `${baseEndpoint}/orders/${orderId}/fulfillments.json`;
        debug(`Fetching fulfillments from: ${fulfillmentUrl}`);
        
        const fulfillmentsResponse = await fetch(fulfillmentUrl, {
          method: "GET",
          headers: {
            "X-Shopify-Access-Token": apiToken,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
        });
        
        if (fulfillmentsResponse.ok) {
          const fulfillmentData = await fulfillmentsResponse.json();
          
          if (fulfillmentData.fulfillments && Array.isArray(fulfillmentData.fulfillments) && fulfillmentData.fulfillments.length > 0) {
            debug(`Found ${fulfillmentData.fulfillments.length} fulfillments in separate call`);
            
            // Create a map of line item IDs to their fulfillment location
            const fulfillmentLocationMap = new Map();
            
            for (const fulfillment of fulfillmentData.fulfillments) {
              if (!fulfillment.location_id) continue;
              
              const locationId = String(fulfillment.location_id);
              let locationName = fulfillment.location?.name || "Unknown Location";
              
              if (fulfillment.line_items && Array.isArray(fulfillment.line_items)) {
                for (const lineItem of fulfillment.line_items) {
                  fulfillmentLocationMap.set(String(lineItem.id), { locationId, locationName });
                  debug(`Found location "${locationName}" for line item ${lineItem.id} in fulfillments API`);
                }
              }
            }
            
            // Update line items with locations from fulfillments
            order.line_items = order.line_items.map(item => {
              const fulfillmentLocation = fulfillmentLocationMap.get(item.id);
              
              if (!item.location_name && fulfillmentLocation) {
                debug(`Updating item ${item.id} with fulfillment location: "${fulfillmentLocation.locationName}"`);
                item.location_id = fulfillmentLocation.locationId;
                item.location_name = fulfillmentLocation.locationName;
              }
              
              return item;
            });
          }
        } else {
          debug(`Failed to fetch fulfillments: ${fulfillmentsResponse.status}`);
        }
      } catch (error) {
        debug(`Error fetching fulfillments: ${error.message}`);
        // We'll continue with what data we have
      }
    }
    
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
    
    // Direct API call to get the order with specific line items
    const baseEndpoint = "https://opus-harley-davidson.myshopify.com/admin/api/2023-07";
    const url = `${baseEndpoint}/orders/${orderId}.json?fields=id,line_items,fulfillments,locations`;
    
    debug(`Calling Shopify API: ${url}`);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": apiToken,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
    });
    
    debug(`Shopify API response status: ${response.status} ${response.statusText}`);
    
    // Get full response contents for debugging
    const responseText = await response.text();
    debug(`Full response text: ${responseText.length > 500 ? responseText.substring(0, 500) + "..." : responseText}`);
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication failed. Your Shopify API token might be invalid or expired.");
      } else if (response.status === 404) {
        throw new Error(`Order ${orderId} not found in Shopify.`);
      } else if (response.status === 403) {
        throw new Error("Access forbidden. Your API token might not have the necessary permissions.");
      } else if (response.status === 429) {
        debug("Rate limit hit, waiting and retrying...");
        // Wait for 2 seconds and retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchSingleLineItem(apiToken, orderId, lineItemId, debug);
      } else {
        throw new Error(`Shopify API error: ${response.status} - ${responseText || "Unknown error"}`);
      }
    }
    
    // Try to parse the JSON response
    let data;
    try {
      data = JSON.parse(responseText);
      debug(`Received order data from Shopify, checking for line item ${lineItemId}`);
    } catch (e) {
      debug(`Error parsing JSON response: ${e.message}`);
      throw new Error(`Failed to parse Shopify API response: ${e.message}`);
    }
    
    if (!data.order || !data.order.line_items) {
      debug(`No valid order or line items found for order ${orderId}`);
      throw new Error(`No valid order or line items returned for order ${orderId}`);
    }
    
    // Log line items for debugging
    debug(`Order has ${data.order.line_items.length} line items. Available IDs: ${data.order.line_items.map((item: any) => item.id).join(', ')}`);
    
    // Find the specific line item - IMPORTANT: Convert both to strings for comparison
    const lineItem = data.order.line_items.find((item: any) => String(item.id) === String(lineItemId));
    
    if (!lineItem) {
      debug(`Line item ${lineItemId} not found in order ${orderId}`);
      // Throw specific error for line item not found
      throw new Error(`Line item ${lineItemId} not found in Shopify order ${orderId}`);
    }
    
    debug(`Successfully found line item ${lineItemId} in order ${orderId}`);
    
    // Ensure ID is always a string
    lineItem.id = String(lineItem.id);
    
    // Extract location information from fulfillments
    const order = data.order;
    let locationFound = false;
    
    // Check for fulfillment location information
    if (order.fulfillments && Array.isArray(order.fulfillments) && order.fulfillments.length > 0) {
      debug(`Order has ${order.fulfillments.length} fulfillments, checking for location data`);
      
      for (const fulfillment of order.fulfillments) {
        if (fulfillment.line_items && Array.isArray(fulfillment.line_items)) {
          // Find the line item in this fulfillment
          const fulfillmentLineItem = fulfillment.line_items.find((l: any) => 
            String(l.id) === String(lineItemId)
          );
          
          if (fulfillmentLineItem && fulfillment.location_id) {
            debug(`Line item ${lineItemId} found in fulfillment with location_id: ${fulfillment.location_id}`);
            lineItem.location_id = String(fulfillment.location_id);
            
            // Try to get location name
            if (fulfillment.location && fulfillment.location.name) {
              lineItem.location_name = fulfillment.location.name;
              debug(`Found location name from fulfillment: ${lineItem.location_name}`);
            } else if (order.locations && Array.isArray(order.locations)) {
              // Look for the location name in the locations array
              const locationInfo = order.locations.find((loc: any) => 
                String(loc.id) === String(fulfillment.location_id)
              );
              
              if (locationInfo && locationInfo.name) {
                lineItem.location_name = locationInfo.name;
                debug(`Found location name from locations array: ${lineItem.location_name}`);
              }
            }
            
            locationFound = true;
            break;
          }
        }
      }
    }
    
    // Add origin location info if available and no fulfillment location was found
    if (!locationFound && lineItem.origin_location) {
      lineItem.location_id = String(lineItem.origin_location.id);
      lineItem.location_name = lineItem.origin_location.name;
      debug(`Using origin_location for item ${lineItemId}: ${lineItem.location_name}`);
    } else if (!locationFound) {
      lineItem.location_id = null;
      lineItem.location_name = null;
      debug(`No location information found for line item ${lineItemId}`);
    }
    
    debug(`Line item details: ${JSON.stringify(lineItem)}`);
    
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
    
    // Return all line items with their location information
    return order.line_items.map(item => {
      // Ensure ID is always a string
      return {
        ...item,
        id: String(item.id)
      };
    });
  } catch (error: any) {
    debug(`Error fetching all line items for order ${orderId}: ${error.message}`);
    throw error;
  }
}
