
import { PicklistDebugInfo, PicklistOrder } from "../types/picklistTypes";

/**
 * Process the fetched data into the final order format
 */
export const processOrderedData = (
  ordersData: any[],
  lineItemsData: any[],
  stockMap: Map<string, any>,
  progressMap: Map<string, any>,
  debug: PicklistDebugInfo
): PicklistOrder[] => {
  // Build a mapping of order_id -> shopify_order_id
  const orderIdToShopifyOrderId: {[key: string]: string} = {};
  ordersData.forEach(order => {
    orderIdToShopifyOrderId[order.id] = order.shopify_order_id;
  });
  
  // Process the line items data to include stock info and progress status
  const processedLineItems = processLineItems(lineItemsData, stockMap, orderIdToShopifyOrderId, progressMap);
  
  // Group line items by order
  const orderMap = buildOrderMap(ordersData);
  
  // Add line items to their respective orders, but ONLY if they have "Ordered" progress
  let orderedItemCount = addLineItemsToOrders(processedLineItems, orderMap);
  
  console.log(`Debug - Found ${orderedItemCount} items with "Ordered" progress`);
  
  // Convert the map to an array of orders and filter out those with no items
  const finalOrders = getFinalOrders(orderMap);
  
  console.log(`Final processing: ${finalOrders.length} orders with ${finalOrders.reduce((count, order) => count + order.items.length, 0)} Ordered items`);
  debug.finalOrderCount = finalOrders.length;
  debug.finalItemCount = finalOrders.reduce((count, order) => count + order.items.length, 0);
  
  return finalOrders;
};

/**
 * Process line items to include stock information and progress data
 */
const processLineItems = (
  lineItemsData: any[], 
  stockMap: Map<string, any>,
  orderIdToShopifyOrderId: {[key: string]: string},
  progressMap: Map<string, any>
) => {
  return lineItemsData.map(item => {
    const stock = stockMap.get(item.sku);
    
    // Use the shopify_order_id (not order_id) to look up progress
    const shopifyOrderId = orderIdToShopifyOrderId[item.order_id];
    if (!shopifyOrderId) {
      console.log(`Warning: No shopify_order_id found for order_id ${item.order_id}`);
    }
    
    // Initialize progress-related variables
    let progress = null;
    let notes = null;
    let hd_orderlinecombo = null;
    let status = null;
    let dealer_po_number = null;
    
    // Check for a match with the specific SKU
    if (item.sku) {
      const progressKey = `${shopifyOrderId}_${item.sku}`;
      const progressData = progressMap.get(progressKey);
      if (progressData) {
        progress = progressData.progress;
        notes = progressData.notes;
        hd_orderlinecombo = progressData.hd_orderlinecombo;
        status = progressData.status;
        dealer_po_number = progressData.dealer_po_number;
      }
    }
    
    // If no match was found and sku is empty/null, check for "No SKU" entries
    if (!progress && (!item.sku || item.sku.trim() === '')) {
      const noSkuKey = `${shopifyOrderId}_No SKU`;
      const noSkuProgressData = progressMap.get(noSkuKey);
      if (noSkuProgressData) {
        progress = noSkuProgressData.progress;
        notes = noSkuProgressData.notes;
        hd_orderlinecombo = noSkuProgressData.hd_orderlinecombo;
        status = noSkuProgressData.status;
        dealer_po_number = noSkuProgressData.dealer_po_number;
        console.log(`Debug - Matched "No SKU" progress for order ${shopifyOrderId}`);
      }
    }
    
    return {
      ...item,
      // Stock data
      in_stock: !!stock,
      stock_quantity: stock?.stock_quantity || null,
      bin_location: stock?.bin_location || null,
      cost: stock?.cost || null,
      // Progress data
      progress: progress,
      notes: notes,
      hd_orderlinecombo: hd_orderlinecombo,
      status: status,
      dealer_po_number: dealer_po_number
    };
  });
};

/**
 * Build a map of orders
 */
const buildOrderMap = (ordersData: any[]): Map<string, PicklistOrder> => {
  const orderMap = new Map();
  ordersData.forEach(order => {
    orderMap.set(order.id, {
      id: order.id,
      shopify_order_id: order.shopify_order_id,
      shopify_order_number: order.shopify_order_number,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      created_at: order.created_at,
      items: []
    });
  });
  return orderMap;
};

/**
 * Add line items to their respective orders if they have "Ordered" progress
 */
const addLineItemsToOrders = (
  processedLineItems: any[], 
  orderMap: Map<string, PicklistOrder>
): number => {
  let orderedItemCount = 0;
  processedLineItems.forEach(item => {
    // Case-insensitive comparison for "Ordered"
    const isOrdered = item.progress && item.progress.toLowerCase() === "ordered";
    if (isOrdered) {
      orderedItemCount++;
      const order = orderMap.get(item.order_id);
      if (order) {
        order.items.push(item);
      } else {
        console.log(`Warning: No order found for order_id ${item.order_id}`);
      }
    }
  });
  return orderedItemCount;
};

/**
 * Get the final filtered orders with at least one item
 */
const getFinalOrders = (orderMap: Map<string, PicklistOrder>): PicklistOrder[] => {
  // Convert the map to an array of orders
  const resultOrders = Array.from(orderMap.values());
  
  // Filter out orders with no items (all items might have been filtered out if none had "Ordered" progress)
  return resultOrders.filter(order => order.items.length > 0);
};
