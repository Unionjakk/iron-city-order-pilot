import { ShopifyOrder, ShopifyLineItem } from "./types.ts";
import { makeShopifyApiRequest, retryOnRateLimit } from "./apiUtils.ts";

/**
 * Gets location information for an order
 */
export async function getLocationInfoForOrder(
  apiToken: string,
  order: ShopifyOrder,
  debug: (message: string) => void,
  debugData?: { request?: string; response?: string },
  includeDebugData = false
): Promise<Map<string, { id: string; name: string }>> {
  // Create a map to store line item ID -> location info
  const locationMap = new Map<string, { id: string; name: string }>();
  
  try {
    // First try to get locations from fulfillment orders
    const fulfillmentOrdersEndpoint = `/orders/${order.id}/fulfillment_orders.json`;
    
    debug(`Fetching fulfillment orders for order ${order.id}`);
    
    try {
      const data = await retryOnRateLimit(
        () => makeShopifyApiRequest(apiToken, fulfillmentOrdersEndpoint, debug, debugData),
        debug
      );
      
      if (data.fulfillment_orders && Array.isArray(data.fulfillment_orders)) {
        debug(`Found ${data.fulfillment_orders.length} fulfillment orders`);
        
        // Process each fulfillment order
        for (const fulfillmentOrder of data.fulfillment_orders) {
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
                locationMap.set(lineItemId, { id: locationId, name: locationName });
                debug(`Line item ${lineItemId} is assigned to ${locationName} (${locationId})`);
              }
            }
          }
        }
      } else {
        debug("No fulfillment orders found or invalid format");
      }
    } catch (error) {
      debug(`Error fetching fulfillment orders: ${error.message}`);
      // Continue with other methods
    }
    
    // If we still don't have locations for all line items, check other sources
    // For example, if the order has been partially fulfilled, we might get location information
    // from the fulfillments array
    if (order.fulfillments && Array.isArray(order.fulfillments) && order.fulfillments.length > 0) {
      debug(`Checking ${order.fulfillments.length} fulfillments for location information`);
      
      for (const fulfillment of order.fulfillments) {
        if (fulfillment.location_id && fulfillment.line_items) {
          const locationId = String(fulfillment.location_id);
          const locationName = fulfillment.location_name || "Unknown Location";
          
          debug(`Fulfillment uses location: ${locationName} (${locationId})`);
          
          // Map each line item in this fulfillment to the location
          for (const lineItem of fulfillment.line_items) {
            if (lineItem.id) {
              const lineItemId = String(lineItem.id);
              // Only add if we don't already have location info for this line item
              if (!locationMap.has(lineItemId)) {
                locationMap.set(lineItemId, { id: locationId, name: locationName });
                debug(`Line item ${lineItemId} is fulfilled from ${locationName} (${locationId})`);
              }
            }
          }
        }
      }
    }
    
    debug(`Found location information for ${locationMap.size} line items`);
    return locationMap;
  } catch (error) {
    debug(`Error getting location info for order ${order.id}: ${error.message}`);
    // Return whatever location information we've gathered so far
    return locationMap;
  }
}

/**
 * Applies location information to line items
 */
export function applyLocationToLineItems(
  lineItems: ShopifyLineItem[],
  locationMap: Map<string, { id: string; name: string }>,
  debug: (message: string) => void
): ShopifyLineItem[] {
  // Make a copy of the line items array
  const updatedLineItems = [...lineItems];
  
  // Apply location information to each line item
  for (const lineItem of updatedLineItems) {
    const lineItemId = String(lineItem.id);
    const locationInfo = locationMap.get(lineItemId);
    
    if (locationInfo) {
      lineItem.location_id = locationInfo.id;
      lineItem.location_name = locationInfo.name;
      debug(`Applied location ${locationInfo.name} to line item ${lineItemId}`);
    } else {
      debug(`No location information found for line item ${lineItemId}`);
      // If we don't have specific location info, keep existing values or set to null
      lineItem.location_id = lineItem.location_id || null;
      lineItem.location_name = lineItem.location_name || null;
    }
  }
  
  return updatedLineItems;
}
