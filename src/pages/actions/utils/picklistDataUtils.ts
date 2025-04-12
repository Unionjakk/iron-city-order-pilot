
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
