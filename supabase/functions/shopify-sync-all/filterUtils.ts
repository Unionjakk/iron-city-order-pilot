import { debug } from "./debugUtils.ts";
import { ShopifyOrder } from "./types.ts";

/**
 * Filter orders to include only active unfulfilled and partially fulfilled orders
 * This is critical for maintaining a clean database with only relevant orders
 */
export function filterActiveUnfulfilledOrders(
  orders: ShopifyOrder[],
  debug: (message: string) => void
): ShopifyOrder[] {
  debug(`Filtering ${orders.length} orders to include only active unfulfilled and partially fulfilled orders`);
  
  const filteredOrders = orders.filter(order => {
    // Check if order is cancelled or closed (inactive)
    const isCancelled = order.cancelled_at !== null && order.cancelled_at !== undefined;
    const isClosed = order.closed_at !== null && order.closed_at !== undefined;
    
    // Check if order is unfulfilled or partially fulfilled
    const isUnfulfilled = order.fulfillment_status === "unfulfilled" || order.fulfillment_status === null;
    const isPartiallyFulfilled = order.fulfillment_status === "partial";
    
    // Keep only orders that are active (not cancelled/closed) AND (unfulfilled OR partially fulfilled)
    const shouldKeep = (!isCancelled && !isClosed) && (isUnfulfilled || isPartiallyFulfilled);
    
    if (!shouldKeep) {
      debug(`Filtered out order ${order.name || order.order_number}: cancelled=${isCancelled}, closed=${isClosed}, fulfillment_status=${order.fulfillment_status}`);
    }
    
    return shouldKeep;
  });
  
  debug(`After filtering, ${filteredOrders.length} orders remain`);
  
  // Log some details about the filtered orders for debugging
  if (filteredOrders.length > 0) {
    const unfulfilled = filteredOrders.filter(o => o.fulfillment_status === "unfulfilled" || o.fulfillment_status === null).length;
    const partiallyFulfilled = filteredOrders.filter(o => o.fulfillment_status === "partial").length;
    debug(`Breakdown: ${unfulfilled} unfulfilled, ${partiallyFulfilled} partially fulfilled orders`);
  }
  
  return filteredOrders;
}
