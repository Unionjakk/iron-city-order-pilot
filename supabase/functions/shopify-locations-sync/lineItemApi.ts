
import { ShopifyLineItem } from "./types.ts";
import { fetchOrdersWithLineItems } from "./orderApi.ts";

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
    return order.line_items;
  } catch (error: any) {
    debug(`Error fetching all line items for order ${orderId}: ${error.message}`);
    throw error;
  }
}
