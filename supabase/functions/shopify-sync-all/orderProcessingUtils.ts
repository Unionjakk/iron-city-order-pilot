
import { ShopifyOrder, ShopifyLineItem } from "./types.ts";

/**
 * Process an order from Shopify and extract location information
 */
export function processOrder(order: any, data: any): ShopifyOrder {
  // Ensure order ID is a string
  order.id = String(order.id);
  
  // Process line items to add location information
  if (order.line_items && Array.isArray(order.line_items)) {
    order.line_items = order.line_items.map((item: any) => processLineItem(item, data));
  }
  
  return order;
}

/**
 * Process a line item and extract location information
 */
function processLineItem(item: any, data: any): ShopifyLineItem {
  // Ensure ID is a string
  item.id = String(item.id);
  if (item.product_id) item.product_id = String(item.product_id);
  if (item.variant_id) item.variant_id = String(item.variant_id);
  
  // Extract location information from the line item
  extractLocationInformation(item, data);
  
  return item as ShopifyLineItem;
}

/**
 * Extract location information for a line item
 */
function extractLocationInformation(item: any, data: any): void {
  // Extract location information from the line item
  if (item.location_id) {
    item.location_id = String(item.location_id);
    // Try to get location name from the locations array if present in the response
    if (data.locations && Array.isArray(data.locations)) {
      const location = data.locations.find((loc: any) => String(loc.id) === String(item.location_id));
      if (location) {
        item.location_name = location.name;
      }
    }
  }
  
  // For fulfillment items check if they have location info
  if (item.fulfillment_line_item_id && data.fulfillments && Array.isArray(data.fulfillments)) {
    const fulfillment = data.fulfillments.find((f: any) => 
      f.line_items && f.line_items.some((l: any) => String(l.id) === String(item.fulfillment_line_item_id))
    );
    
    if (fulfillment && fulfillment.location_id) {
      item.location_id = String(fulfillment.location_id);
      
      // Try to get location name
      if (data.locations && Array.isArray(data.locations)) {
        const location = data.locations.find((loc: any) => String(loc.id) === String(fulfillment.location_id));
        if (location) {
          item.location_name = location.name;
        }
      }
    }
  }
}
