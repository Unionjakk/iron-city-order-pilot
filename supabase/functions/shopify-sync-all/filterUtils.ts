
/**
 * Filters orders to ensure we only process active unfulfilled or partially fulfilled orders
 */
export function filterActiveUnfulfilledOrders(orders: any[], debug: (message: string) => void): any[] {
  debug(`Filtering ${orders.length} orders from Shopify API`);
  
  // Initialize counter for excluded orders
  let excludedCount = 0;
  
  // Filter the orders based on criteria
  const filteredOrders = orders.filter(order => {
    // Skip if order doesn't have required fields
    if (!order || !order.id) {
      debug(`Excluding order: Missing ID`);
      excludedCount++;
      return false;
    }
    
    // Check if order is cancelled
    if (order.cancelled_at || order.cancel_reason) {
      debug(`Excluding order ${order.name || order.id}: Cancelled`);
      excludedCount++;
      return false;
    }
    
    // Check if order is archived
    if (order.status === 'archived' || order.archived) {
      debug(`Excluding order ${order.name || order.id}: Archived`);
      excludedCount++;
      return false;
    }
    
    // Check if order has a valid fulfillment status
    // We only want unfulfilled or partially_fulfilled
    const fulfillmentStatus = order.fulfillment_status || 'unfulfilled';
    
    if (fulfillmentStatus !== 'unfulfilled' && fulfillmentStatus !== 'partial') {
      debug(`Excluding order ${order.name || order.id}: Invalid fulfillment status ${fulfillmentStatus}`);
      excludedCount++;
      return false;
    }
    
    // Check that the order has line items
    if (!order.line_items || !Array.isArray(order.line_items) || order.line_items.length === 0) {
      debug(`Excluding order ${order.name || order.id}: No line items`);
      excludedCount++;
      return false;
    }
    
    // This order meets our criteria
    return true;
  });
  
  // Log results
  debug(`Filtered out ${excludedCount} orders that didn't meet criteria`);
  debug(`Returning ${filteredOrders.length} filtered orders for processing`);
  
  return filteredOrders;
}
