
import { LEEDS_LOCATION_ID } from "../constants/picklistConstants";

/**
 * Create a progress lookup map from progress data
 */
export const createProgressMap = (progressData: any[]) => {
  const progressMap = new Map();
  
  progressData.forEach(item => {
    const key = `${item.shopify_order_id}_${item.sku || 'No SKU'}`;
    progressMap.set(key, {
      shopify_order_id: item.shopify_order_id,
      sku: item.sku,
      progress: item.progress,
      notes: item.notes,
      hd_orderlinecombo: item.hd_orderlinecombo,
      status: item.status,
      dealer_po_number: item.dealer_po_number,
      quantity: item.quantity,
      quantity_required: item.quantity_required,
      quantity_picked: item.quantity_picked
    });
  });
  
  return progressMap;
};

/**
 * Create a stock lookup map from stock data
 */
export const createStockMap = (stockData: any[]) => {
  const stockMap = new Map();
  
  stockData.forEach(item => {
    stockMap.set(item.part_no, {
      stock_quantity: item.stock_quantity,
      bin_location: item.bin_location,
      cost: item.cost
    });
  });
  
  return stockMap;
};

/**
 * Extract unique SKUs from line items
 */
export const extractUniqueSkus = (lineItems: any[]) => {
  const skus = Array.from(new Set(
    lineItems
      .filter(item => item.sku && item.sku.trim() !== '')
      .map(item => item.sku)
  ));
  
  return skus;
};

/**
 * Filter line items for Leeds location
 */
export const filterLeedsLineItems = (lineItems: any[]) => {
  if (!lineItems) return [];
  
  return lineItems.filter(item => 
    !item.location_id || item.location_id === LEEDS_LOCATION_ID
  );
};

/**
 * Process orders and their line items
 * (This function was missing in the original file)
 */
export const processOrdersData = (
  orders: any[],
  lineItemsData: any[],
  stockMap: Map<string, any>,
  progressMap: Map<string, any>
) => {
  const result = orders.map(order => {
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
        
        // Try to match with specific SKU
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
          }
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
          quantity_picked: quantity_picked
        };
      });
      
    // Now check for "No SKU" progress entries that don't correspond to any line item
    const noSkuProgressKey = `${order.shopify_order_id}_No SKU`;
    const noSkuProgress = progressMap.get(noSkuProgressKey);
    
    if (noSkuProgress) {
      // Check if we already have an item with "No SKU"
      const hasNoSkuItem = orderItems.some(item => item.sku === "No SKU");
      
      if (!hasNoSkuItem) {
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
          quantity_picked: noSkuProgress.quantity_picked
        });
      }
    }
    
    return {
      id: order.id,
      shopify_order_id: order.shopify_order_id,
      shopify_order_number: order.shopify_order_number,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      created_at: order.created_at,
      items: orderItems
    };
  });
  
  return result;
};
