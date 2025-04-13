
/**
 * Process a Shopify order to ensure it has all required fields
 */
export function processOrder(order: any, rawData: any): any {
  // Clone the order to avoid modifying the original
  const processedOrder = { ...order };
  
  // Ensure line items are processed correctly
  if (processedOrder.line_items && Array.isArray(processedOrder.line_items)) {
    processedOrder.line_items = processedOrder.line_items.map(item => {
      // Make sure each line item has required fields
      return {
        ...item,
        // Default location data if not present
        location_id: item.location_id || null,
        location_name: item.location_name || null
      };
    });
  }
  
  // Ensure that we have a consistent fulfillment_status value
  // Shopify sometimes returns null for unfulfilled orders
  if (processedOrder.fulfillment_status === null || processedOrder.fulfillment_status === undefined) {
    processedOrder.fulfillment_status = "unfulfilled";
  }
  
  return processedOrder;
}
