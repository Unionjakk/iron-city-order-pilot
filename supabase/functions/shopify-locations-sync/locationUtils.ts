
import { makeShopifyApiRequest, retryOnRateLimit } from "./apiUtils.ts";
import { ShopifyLineItem, LineItemLocationUpdate } from "./types.ts";

/**
 * Extracts location information from an order's fulfillments and applies it to line items
 */
export async function getLocationInfoForOrder(
  apiToken: string,
  order: any,
  debug: (message: string) => void,
  debugData?: { request?: string; response?: string },
  includeDebugData = false
): Promise<Map<string, LineItemLocationUpdate>> {
  try {
    debug(`Getting location information for order ${order.id}`);
    const locationUpdates = new Map<string, LineItemLocationUpdate>();
    
    // First, let's check if we already have location information in the order
    // Some orders might already include location_id directly in line items
    if (order.line_items && Array.isArray(order.line_items)) {
      for (const item of order.line_items) {
        if (item.location_id) {
          debug(`Line item ${item.id} already has location_id: ${item.location_id}`);
          
          // Fetch location name for this ID if not already present
          if (!item.location_name) {
            debug(`Fetching location name for location ID: ${item.location_id}`);
            const locationInfo = await fetchLocationInfo(apiToken, item.location_id, debug, debugData);
            
            if (locationInfo) {
              locationUpdates.set(item.id, {
                id: item.id,
                location_id: item.location_id,
                location_name: locationInfo.name
              });
            } else {
              // If we can't get the name, still use the ID
              locationUpdates.set(item.id, {
                id: item.id,
                location_id: item.location_id,
                location_name: null
              });
            }
          } else {
            // We already have both ID and name
            locationUpdates.set(item.id, {
              id: item.id,
              location_id: item.location_id,
              location_name: item.location_name
            });
          }
        }
      }
    }
    
    // Next, check the fulfillments for more location information
    if (order.fulfillments && Array.isArray(order.fulfillments)) {
      debug(`Order has ${order.fulfillments.length} fulfillments`);
      
      for (const fulfillment of order.fulfillments) {
        if (fulfillment.location_id) {
          debug(`Fulfillment has location_id: ${fulfillment.location_id}`);
          
          // Fetch location name for this fulfillment
          let locationName = null;
          if (!fulfillment.location_name) {
            debug(`Fetching location name for fulfillment location ID: ${fulfillment.location_id}`);
            const locationInfo = await fetchLocationInfo(apiToken, fulfillment.location_id, debug, debugData);
            if (locationInfo) {
              locationName = locationInfo.name;
            }
          } else {
            locationName = fulfillment.location_name;
          }
          
          // Process line items in this fulfillment
          if (fulfillment.line_items && Array.isArray(fulfillment.line_items)) {
            for (const item of fulfillment.line_items) {
              debug(`Associating line item ${item.id} with location ${fulfillment.location_id}`);
              locationUpdates.set(item.id, {
                id: item.id,
                location_id: fulfillment.location_id,
                location_name: locationName
              });
            }
          }
        }
      }
    }
    
    // Finally, fetch locations for the entire shop to assign to any remaining items
    debug(`Checking for shop locations to assign to remaining items`);
    try {
      const shopLocations = await fetchShopLocations(apiToken, debug, debugData);
      
      if (shopLocations && shopLocations.length > 0) {
        debug(`Found ${shopLocations.length} locations for the shop`);
        
        // Find the primary location
        const primaryLocation = shopLocations.find(loc => loc.primary === true) || shopLocations[0];
        
        if (primaryLocation) {
          debug(`Using primary location: ${primaryLocation.id} (${primaryLocation.name})`);
          
          // Assign the primary location to any line items that don't have a location yet
          if (order.line_items && Array.isArray(order.line_items)) {
            for (const item of order.line_items) {
              if (!locationUpdates.has(item.id)) {
                debug(`Assigning primary location to line item ${item.id}`);
                locationUpdates.set(item.id, {
                  id: item.id,
                  location_id: primaryLocation.id,
                  location_name: primaryLocation.name
                });
              }
            }
          }
        }
      }
    } catch (error) {
      debug(`Error fetching shop locations: ${error.message}`);
      // Continue without shop locations
    }
    
    debug(`Found location information for ${locationUpdates.size} line items`);
    return locationUpdates;
  } catch (error: any) {
    debug(`Exception in getLocationInfoForOrder: ${error.message}`);
    return new Map();
  }
}

/**
 * Applies location information to line items
 */
export function applyLocationToLineItems(
  lineItems: ShopifyLineItem[],
  locationInfo: Map<string, LineItemLocationUpdate>,
  debug: (message: string) => void
): ShopifyLineItem[] {
  if (!lineItems || !Array.isArray(lineItems)) {
    debug("No line items to apply location information to");
    return [];
  }
  
  debug(`Applying location information to ${lineItems.length} line items`);
  
  return lineItems.map(item => {
    const locationUpdate = locationInfo.get(item.id);
    
    if (locationUpdate) {
      debug(`Applied location ${locationUpdate.location_id} (${locationUpdate.location_name || 'unnamed'}) to line item ${item.id}`);
      return {
        ...item,
        location_id: locationUpdate.location_id,
        location_name: locationUpdate.location_name
      };
    }
    
    debug(`No location information found for line item ${item.id}`);
    return item;
  });
}

/**
 * Fetches information about a specific location
 */
async function fetchLocationInfo(
  apiToken: string,
  locationId: string,
  debug: (message: string) => void,
  debugData?: { request?: string; response?: string }
) {
  try {
    const endpoint = `/locations/${locationId}.json`;
    
    debug(`Fetching location info for ID: ${locationId}`);
    
    const data = await retryOnRateLimit(
      () => makeShopifyApiRequest(apiToken, endpoint, debug, debugData),
      debug
    );
    
    if (!data.location) {
      debug(`No location data found for ID: ${locationId}`);
      return null;
    }
    
    debug(`Found location: ${data.location.name}`);
    return data.location;
  } catch (error: any) {
    debug(`Error fetching location info: ${error.message}`);
    return null;
  }
}

/**
 * Fetches all locations for the shop
 */
async function fetchShopLocations(
  apiToken: string,
  debug: (message: string) => void,
  debugData?: { request?: string; response?: string }
) {
  try {
    const endpoint = '/locations.json';
    
    debug('Fetching all shop locations');
    
    const data = await retryOnRateLimit(
      () => makeShopifyApiRequest(apiToken, endpoint, debug, debugData),
      debug
    );
    
    if (!data.locations || !Array.isArray(data.locations)) {
      debug('No locations data found for shop');
      return [];
    }
    
    debug(`Found ${data.locations.length} locations for shop`);
    return data.locations;
  } catch (error: any) {
    debug(`Error fetching shop locations: ${error.message}`);
    return [];
  }
}
