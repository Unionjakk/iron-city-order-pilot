import { debug } from "./debugUtils.ts";

/**
 * Filter orders to ensure they match our criteria:
 * 1. Must be unfulfilled or partially fulfilled
 * 2. Must not be cancelled or archived
 */
export function filterActiveUnfulfilledOrders(orders: any[], debug: (message: string) => void): any[] {
  debug(`Filtering ${orders.length} orders to only include active unfulfilled/partial orders`);
  
  // Count by fulfillment status before filtering
  const countByStatus: Record<string, number> = {};
  orders.forEach(order => {
    const status = order.fulfillment_status || 'null';
    countByStatus[status] = (countByStatus[status] || 0) + 1;
  });
  
  debug(`Orders by fulfillment status before filtering: ${JSON.stringify(countByStatus)}`);
  
  // Only keep orders that are unfulfilled or partially fulfilled 
  const filteredOrders = orders.filter(order => {
    // Skip cancelled or archived orders
    if (order.cancelled_at || order.closed_at) {
      return false;
    }
    
    // Must be open/active status
    if (order.status !== 'open') {
      return false;
    }
    
    // Must be unfulfilled or partially fulfilled
    const fulfillmentStatus = order.fulfillment_status;
    return fulfillmentStatus === null || 
           fulfillmentStatus === 'unfulfilled' || 
           fulfillmentStatus === 'partial';
  });
  
  debug(`After filtering: ${filteredOrders.length} orders match criteria`);
  return filteredOrders;
}
