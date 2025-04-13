
import { ShopifyOrder } from "./types.ts";

/**
 * Process a Shopify order to extract and normalize relevant information
 */
export function processOrder(order: any, data: any): ShopifyOrder {
  // Make a deep copy to avoid modifying the original
  const processedOrder = { ...order };
  
  // Add additional fields or transform data as needed
  if (!processedOrder.customer_name && processedOrder.customer) {
    processedOrder.customer_name = `${processedOrder.customer.first_name || ''} ${processedOrder.customer.last_name || ''}`.trim();
  }
  
  // Process line items if they exist
  if (processedOrder.line_items && Array.isArray(processedOrder.line_items)) {
    // Ensure line items have required fields
    processedOrder.line_items = processedOrder.line_items.map(item => ({
      ...item,
      title: item.title || 'Unknown Product',
      quantity: typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity || '1', 10),
      price: item.price || '0.00'
    }));
  }
  
  return processedOrder;
}
