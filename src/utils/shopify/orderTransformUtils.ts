
import { ShopifyOrder } from '@/components/shopify/OrdersTable';

/**
 * Transforms raw orders and line items data into ShopifyOrder objects
 */
export const transformOrdersData = (
  orders: any[],
  lineItemsByOrderId?: Record<string, any[]>
): ShopifyOrder[] => {
  if (!orders || orders.length === 0) {
    return [];
  }

  return orders.map((order) => {
    return {
      id: order.id,
      shopify_order_id: order.shopify_order_id,
      shopify_order_number: order.shopify_order_number || order.shopify_order_id,
      created_at: order.created_at,
      customer_name: order.customer_name,
      items_count: order.items_count,
      status: order.status,
      imported_at: order.imported_at,
      line_items: lineItemsByOrderId?.[order.id] || []
    } as ShopifyOrder;
  });
};

/**
 * Determines the last import time from either settings or the most recent order
 */
export const determineLastImportTime = (
  lastSyncTime: string | null,
  orders: any[]
): string | null => {
  if (lastSyncTime) {
    return lastSyncTime;
  }
  
  if (!orders || orders.length === 0) {
    return null;
  }
  
  // Find the most recent import time from orders
  const latestOrder = orders.reduce((latest, order) => {
    return new Date(latest.imported_at || '0') > new Date(order.imported_at || '0') 
      ? latest 
      : order;
  }, orders[0]);
  
  return latestOrder.imported_at || null;
};
