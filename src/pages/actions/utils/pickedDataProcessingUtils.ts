
import { PicklistOrder, PicklistOrderItem } from "../types/picklistTypes";
import { LEEDS_LOCATION_ID } from "../constants/picklistConstants";

/**
 * Process orders and their line items for picked items
 */
export const processPickedOrdersData = (
  orders: any[],
  lineItemsData: any[],
  stockMap: Map<string, any>,
  progressMap: Map<string, any>
): PicklistOrder[] => {
  // Build a mapping of order_id -> shopify_order_id
  const orderIdToShopifyOrderId = {};
  orders.forEach(order => {
    orderIdToShopifyOrderId[order.id] = order.shopify_order_id;
  });
  
  // Create a Set of order IDs that have at least one picked item
  const orderIdsWithPickedItems = new Set(
    Array.from(progressMap.values())
      .filter(progress => progress.progress === "Picked")
      .map(progress => progress.shopify_order_id)
  );
  
  // Map orders to the final format, handling both regular SKUs and "No SKU" items
  const result = orders
    .filter(order => orderIdsWithPickedItems.has(order.shopify_order_id))
    .map(order => {
      // Find all line items for this order
      const orderItems = lineItemsData
        .filter(item => item.order_id === order.id)
        .map(item => {
          const stock = stockMap.get(item.sku);
          const shopifyOrderId = order.shopify_order_id;
          
          // Initialize progress and notes to null
          let progress = null;
          let notes = null;
          let hd_orderlinecombo = null;
          let status = null;
          let dealer_po_number = null;
          let quantity_required = null;
          let quantity_picked = null;
          let is_partial = false;
          
          // First try to match with specific SKU
          if (item.sku) {
            const progressKey = `${shopifyOrderId}_${item.sku}`;
            const progressData = progressMap.get(progressKey);
            if (progressData) {
              progress = progressData.progress;
              notes = progressData.notes;
              hd_orderlinecombo = progressData.hd_orderlinecombo;
              status = progressData.status;
              dealer_po_number = progressData.dealer_po_number;
              quantity_required = progressData.quantity_required;
              quantity_picked = progressData.quantity_picked;
              is_partial = progressData.is_partial || false;
            }
          }
          
          // If no match and sku is empty/null, check for "No SKU" entries
          if (!progress && (!item.sku || item.sku.trim() === '')) {
            const noSkuKey = `${shopifyOrderId}_No SKU`;
            const noSkuProgressData = progressMap.get(noSkuKey);
            if (noSkuProgressData) {
              progress = noSkuProgressData.progress;
              notes = noSkuProgressData.notes;
              hd_orderlinecombo = noSkuProgressData.hd_orderlinecombo;
              status = noSkuProgressData.status;
              dealer_po_number = noSkuProgressData.dealer_po_number;
              quantity_required = noSkuProgressData.quantity_required;
              quantity_picked = noSkuProgressData.quantity_picked;
              is_partial = noSkuProgressData.is_partial || false;
              console.log(`Matched "No SKU" progress for order ${shopifyOrderId}`);
            }
          }
          
          // Log what we're doing
          console.log(`Processing item for order ${order.id}, SKU: ${item.sku || 'No SKU'}, ` +
                      `Progress: ${progress}, Notes: ${notes}, ` +
                      `Quantities: Required=${quantity_required}, Picked=${quantity_picked}, Partial=${is_partial}`);
          
          // Only include line items that have "Picked" progress status
          if (progress !== "Picked") {
            return null;
          }
          
          return {
            id: item.id,
            order_id: item.order_id,
            shopify_line_item_id: item.shopify_line_item_id,
            sku: item.sku || "No SKU",
            title: item.title,
            quantity: item.quantity,
            price: item.price,
            created_at: order.created_at,
            location_id: item.location_id,
            location_name: item.location_name,
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
            dealer_po_number: dealer_po_number,
            // Quantity tracking
            quantity_required: quantity_required,
            quantity_picked: quantity_picked,
            is_partial: is_partial
          } as PicklistOrderItem;
        })
        .filter(Boolean); // Remove null items (ones without "Picked" progress status)
        
      // If we have "No SKU" progress data but no matching line item, we need to create a "dummy" item
      const noSkuProgressKey = `${order.shopify_order_id}_No SKU`;
      const noSkuProgress = progressMap.get(noSkuProgressKey);
      
      if (noSkuProgress && noSkuProgress.progress === "Picked") {
        // Check if we already have an item with "No SKU"
        const hasNoSkuItem = orderItems.some(item => item.sku === "No SKU");
        
        if (!hasNoSkuItem) {
          console.log(`Creating a "No SKU" item for order ${order.id} because it has "No SKU" progress`);
          // Add a dummy item for "No SKU"
          orderItems.push({
            id: `no-sku-${order.id}`,
            order_id: order.id,
            shopify_line_item_id: `no-sku-${order.shopify_order_id}`,
            sku: "No SKU",
            title: "No SKU Item",
            quantity: 1,
            price: null,
            created_at: order.created_at,
            location_id: LEEDS_LOCATION_ID,
            location_name: "Leeds",
            // Stock data
            in_stock: false,
            stock_quantity: null,
            bin_location: null,
            cost: null,
            // Progress data
            progress: noSkuProgress.progress,
            notes: noSkuProgress.notes,
            hd_orderlinecombo: noSkuProgress.hd_orderlinecombo,
            status: noSkuProgress.status,
            dealer_po_number: noSkuProgress.dealer_po_number,
            // Quantity tracking
            quantity_required: noSkuProgress.quantity_required,
            quantity_picked: noSkuProgress.quantity_picked,
            is_partial: noSkuProgress.is_partial || false
          } as PicklistOrderItem);
        }
      }
      
      // Only return the order if it has at least one picked item
      if (orderItems.length === 0) return null;
      
      return {
        id: order.id,
        shopify_order_id: order.shopify_order_id,
        shopify_order_number: order.shopify_order_number,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        created_at: order.created_at,
        items: orderItems
      } as PicklistOrder;
    })
    .filter(Boolean); // Remove orders with no picked items
    
  console.log(`Final orders with picked items: ${result.length}, total items: ${
    result.reduce((count, order) => count + order.items.length, 0)
  }`);
  
  return result;
};
