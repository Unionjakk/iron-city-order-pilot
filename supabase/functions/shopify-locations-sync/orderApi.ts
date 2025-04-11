
import { ShopifyOrder, ShopifyLineItem } from "./types.ts";
import { makeShopifyApiRequest, retryOnRateLimit } from "./apiUtils.ts";
import { getLocationInfoForOrder, applyLocationToLineItems } from "./locationUtils.ts";

/**
 * Fetches a specific order with line items from Shopify
 */
export async function fetchOrdersWithLineItems(
  apiToken: string,
  orderId: string,
  debug: (message: string) => void
): Promise<ShopifyOrder> {
  try {
    // Get the order with necessary fields
    const endpoint = `/orders/${orderId}.json?fields=id,name,created_at,customer,line_items,shipping_address,note,fulfillment_status,fulfillments,locations`;
    
    // Use retry logic for API calls
    const data = await retryOnRateLimit(
      () => makeShopifyApiRequest(apiToken, endpoint, debug),
      debug
    );
    
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
      
      // Get location information for the order
      const locationInfo = await getLocationInfoForOrder(apiToken, order, debug);
      
      // Apply location information to line items
      order.line_items = applyLocationToLineItems(order.line_items, locationInfo, debug);
    }
    
    debug(`Processed order ${orderId} with ${order.line_items?.length || 0} line items`);
    
    return order;
  } catch (error: any) {
    debug(`Exception in fetchOrdersWithLineItems: ${error.message}`);
    throw error;
  }
}
