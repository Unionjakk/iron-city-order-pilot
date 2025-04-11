
import { supabase } from "@/integrations/supabase/client";
import { PicklistOrder, PicklistOrderItem } from "../types/picklistTypes";
import { LEEDS_LOCATION_ID } from "../constants/picklistConstants";

/**
 * Process orders and their line items into the PicklistOrder format
 */
export const processOrdersData = (
  orders: any[],
  lineItemsData: any[],
  stockMap: Map<string, any>,
  progressMap: Map<string, any>
): PicklistOrder[] => {
  return orders
    .map(order => {
      // Find all line items for this order
      const orderItems = lineItemsData
        .filter(item => item.order_id === order.id)
        .map(item => {
          const stock = stockMap.get(item.sku);
          const progressKey = `${order.shopify_order_id}_${item.sku}`;
          const progress = progressMap.get(progressKey);
          
          // Only include line items that don't have progress status
          if (progress?.progress) {
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
            progress: progress?.progress || null,
            notes: progress?.notes || null
          } as PicklistOrderItem;
        })
        .filter(Boolean); // Remove null items (ones with progress status)
        
      // Only return the order if it has at least one item with no progress
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
    .filter(Boolean); // Remove orders with no items
};

/**
 * Get unique SKUs from line items
 */
export const extractUniqueSkus = (lineItemsData: any[]): string[] => {
  return [...new Set(lineItemsData.map(item => item.sku).filter(Boolean))];
};

/**
 * Create a lookup map from progress data
 */
export const createProgressMap = (progressData: any[]): Map<string, any> => {
  const progressMap = new Map();
  progressData?.forEach(progress => {
    const key = `${progress.shopify_order_id}_${progress.sku}`;
    progressMap.set(key, progress);
  });
  return progressMap;
};

/**
 * Create a lookup map from stock data
 */
export const createStockMap = (stockData: any[]): Map<string, any> => {
  const stockMap = new Map();
  stockData?.forEach(stock => {
    stockMap.set(stock.part_no, stock);
  });
  return stockMap;
};

/**
 * Filter line items for Leeds location
 */
export const filterLeedsLineItems = (allLineItemsData: any[]): any[] => {
  return allLineItemsData?.filter(item => 
    item.location_id === LEEDS_LOCATION_ID
  ) || [];
};
