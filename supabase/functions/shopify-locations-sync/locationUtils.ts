
import { makeShopifyApiRequest, retryOnRateLimit, SHOPIFY_API_BASE_URL } from "./apiUtils.ts";

/**
 * Extracts location information from fulfillments
 */
export function extractLocationFromFulfillments(
  fulfillments: any[],
  debug: (message: string) => void
): { id: string | null; name: string | null } {
  if (!fulfillments || !Array.isArray(fulfillments) || fulfillments.length === 0) {
    debug('No fulfillments available to extract location from');
    return { id: null, name: null };
  }
  
  debug(`Examining ${fulfillments.length} fulfillments for location information`);
  debug(`RAW FULFILLMENTS DATA: ${JSON.stringify(fulfillments)}`);
  
  // Extract location from the first fulfillment
  const fulfillment = fulfillments[0];
  
  if (!fulfillment.location_id) {
    debug('No location_id found in first fulfillment');
    return { id: null, name: null };
  }
  
  const locationId = String(fulfillment.location_id);
  let locationName = null;
  
  // Try to get the location name from various sources
  if (fulfillment.location && fulfillment.location.name) {
    locationName = fulfillment.location.name;
    debug(`Found location name from fulfillment.location: ${locationName}`);
  }
  
  return { id: locationId, name: locationName };
}

/**
 * Fetches fulfillments for an order directly
 */
export async function fetchOrderFulfillments(
  apiToken: string,
  orderId: string,
  debug: (message: string) => void
): Promise<any[]> {
  try {
    debug(`Fetching fulfillments for order ${orderId}`);
    
    const data = await retryOnRateLimit(
      () => makeShopifyApiRequest(apiToken, `/orders/${orderId}/fulfillments.json`, debug),
      debug
    );
    
    if (!data.fulfillments || !Array.isArray(data.fulfillments)) {
      debug('No fulfillments returned from API');
      return [];
    }
    
    debug(`Found ${data.fulfillments.length} fulfillments from direct API call`);
    return data.fulfillments;
  } catch (error) {
    debug(`Error fetching fulfillments: ${error.message}`);
    return [];
  }
}

/**
 * Attempts to find location information from various sources
 */
export async function getLocationInfoForOrder(
  apiToken: string,
  order: any,
  debug: (message: string) => void
): Promise<{ id: string | null; name: string | null }> {
  let locationInfo = { id: null, name: null };
  
  // Log the complete order structure for debugging
  debug(`RAW ORDER DATA: ${JSON.stringify(order)}`);
  
  // First check if there are fulfillments in the order data
  if (order.fulfillments && Array.isArray(order.fulfillments) && order.fulfillments.length > 0) {
    debug(`Order has ${order.fulfillments.length} fulfillments, extracting location data`);
    locationInfo = extractLocationFromFulfillments(order.fulfillments, debug);
  }
  
  // If location info is missing, look for it in the locations array
  if ((!locationInfo.name || !locationInfo.id) && locationInfo.id && 
      order.locations && Array.isArray(order.locations)) {
    debug(`Looking for location info in locations array`);
    const locationFromArray = order.locations.find(loc => String(loc.id) === locationInfo.id);
    
    if (locationFromArray && locationFromArray.name) {
      locationInfo.name = locationFromArray.name;
      debug(`Found location name from locations array: ${locationInfo.name}`);
    }
  }
  
  // Check if there's location info in the line items
  if ((!locationInfo.id || !locationInfo.name) && order.line_items && Array.isArray(order.line_items)) {
    debug(`Checking line items for location information`);
    
    for (const item of order.line_items) {
      if (item.origin_location) {
        debug(`Found origin_location in line item: ${JSON.stringify(item.origin_location)}`);
        locationInfo.id = String(item.origin_location.id);
        locationInfo.name = item.origin_location.name;
        break;
      }
      
      if (item.location_id) {
        debug(`Found location_id in line item: ${item.location_id}`);
        locationInfo.id = String(item.location_id);
        // Try to find matching location name
        if (order.locations && Array.isArray(order.locations)) {
          const location = order.locations.find(loc => String(loc.id) === String(item.location_id));
          if (location && location.name) {
            locationInfo.name = location.name;
            debug(`Found location name from item location_id: ${locationInfo.name}`);
          }
        }
        break;
      }
    }
  }
  
  // If we still don't have complete location info, try to fetch fulfillments directly
  if (!locationInfo.name || !locationInfo.id) {
    debug(`No complete location data found in order, making one final check with fulfillments API`);
    const fulfillments = await fetchOrderFulfillments(apiToken, order.id, debug);
    
    if (fulfillments.length > 0) {
      const fulfillmentLocationInfo = extractLocationFromFulfillments(fulfillments, debug);
      
      // Only update if we found better information
      if (fulfillmentLocationInfo.id && fulfillmentLocationInfo.name) {
        locationInfo = fulfillmentLocationInfo;
        debug(`Found location from direct fulfillments API: ${locationInfo.name}`);
      }
    }
  }
  
  // If we still don't have location info, try fetching locations directly
  if (!locationInfo.name && locationInfo.id) {
    debug(`Have location ID ${locationInfo.id} but no name, trying to fetch location details`);
    try {
      const locationData = await retryOnRateLimit(
        () => makeShopifyApiRequest(apiToken, `/locations/${locationInfo.id}.json`, debug),
        debug
      );
      
      if (locationData && locationData.location && locationData.location.name) {
        locationInfo.name = locationData.location.name;
        debug(`Found location name from direct location API: ${locationInfo.name}`);
      }
    } catch (error) {
      debug(`Error fetching location details: ${error.message}`);
    }
  }
  
  return locationInfo;
}

/**
 * Applies location information to line items
 */
export function applyLocationToLineItems(
  lineItems: any[],
  locationInfo: { id: string | null; name: string | null },
  debug: (message: string) => void
): any[] {
  if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
    debug('No line items to apply location information to');
    return [];
  }
  
  return lineItems.map(item => {
    // Ensure ID is always a string for consistent comparison
    item.id = String(item.id);
    
    // Set location information if available
    if (locationInfo.id && locationInfo.name) {
      debug(`Setting location info for item ${item.id}: ${locationInfo.name} (${locationInfo.id})`);
      item.location_id = locationInfo.id;
      item.location_name = locationInfo.name;
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

    return item;
  });
}
