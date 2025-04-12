import { useState, useEffect } from "react";
import { PicklistOrder, PicklistDebugInfo, PicklistDataResult } from "../types/picklistTypes";
import { LEEDS_LOCATION_ID } from "../constants/picklistConstants";
import { 
  createProgressMap,
  createStockMap,
  extractUniqueSkus,
  filterLeedsLineItems
} from "../utils/picklistDataUtils";
import {
  fetchOrdersWithPickedItems,
  fetchLineItemsForOrders,
  fetchStockForSkus,
  fetchPickedItemsProgress,
  checkOrderStatuses
} from "../services/pickedDataService";

/**
 * Process orders and their line items for picked items
 */
const processPickedOrdersData = (
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
              console.log(`Matched "No SKU" progress for order ${shopifyOrderId}`);
            }
          }
          
          // Log what we're doing
          console.log(`Processing item for order ${order.id}, SKU: ${item.sku || 'No SKU'}, ` +
                      `Progress: ${progress}, Notes: ${notes}`);
          
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
            dealer_po_number: dealer_po_number
          };
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
            dealer_po_number: noSkuProgress.dealer_po_number
          });
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
      };
    })
    .filter(Boolean); // Remove orders with no picked items
    
  console.log(`Final orders with picked items: ${result.length}, total items: ${
    result.reduce((count, order) => count + order.items.length, 0)
  }`);
  
  return result;
};

/**
 * Hook to fetch and manage picked items data
 */
export const usePickedData = (): PicklistDataResult => {
  const [orders, setOrders] = useState<PicklistOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<PicklistDebugInfo>({} as PicklistDebugInfo);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    const debug: PicklistDebugInfo = {
      orderCount: 0,
      lineItemCount: 0,
      progressItemCount: 0,
      finalOrderCount: 0,
      finalItemCount: 0,
      orderStatus: [],
      fetchStartTime: new Date().toISOString()
    };
    
    try {
      console.log("Fetching picked items data for Leeds location ID:", LEEDS_LOCATION_ID);
      
      // Step 1: Get all progress entries marked as "Picked"
      const progressData = await fetchPickedItemsProgress();
      
      console.log(`Found ${progressData?.length || 0} items with "Picked" progress`);
      debug.progressItemCount = progressData?.length || 0;
      debug.progressItems = progressData?.slice(0, 5);
      
      if (!progressData || progressData.length === 0) {
        console.log("No items marked as picked");
        
        debug.endTime = new Date().toISOString();
        debug.timeTaken = (new Date(debug.endTime).getTime() - new Date(debug.fetchStartTime).getTime()) / 1000;
        setDebugInfo({ ...debug, progressFetchResult: "No items marked as picked" });
        setOrders([]);
        setIsLoading(false);
        return;
      }
      
      // Create a lookup map for progress data
      const progressMap = createProgressMap(progressData || []);
      
      // Step 2: Get all unfulfilled orders
      const ordersData = await fetchOrdersWithPickedItems();
      
      console.log(`Found ${ordersData.length} orders with status 'unfulfilled'`);
      debug.orderCount = ordersData.length;
      
      if (!ordersData || ordersData.length === 0) {
        console.log("No orders found with status 'unfulfilled'");
        
        debug.endTime = new Date().toISOString();
        debug.timeTaken = (new Date(debug.endTime).getTime() - new Date(debug.fetchStartTime).getTime()) / 1000;
        setDebugInfo({ ...debug, ordersFetchResult: "No orders found" });
        setOrders([]);
        setIsLoading(false);
        return;
      }
      
      // Step 3: Get all line items for these orders that are at Leeds location
      const orderIds = ordersData.map(order => order.id);
      
      // First get all line items for the orders
      const allLineItemsData = await fetchLineItemsForOrders(orderIds);
      
      console.log(`Found ${allLineItemsData?.length || 0} total line items for all orders`);
      debug.totalLineItems = allLineItemsData?.length || 0;
      
      // Now filter for Leeds location
      const lineItemsData = filterLeedsLineItems(allLineItemsData);
      
      console.log(`Found ${lineItemsData.length} line items at Leeds location (ID: ${LEEDS_LOCATION_ID})`);
      debug.lineItemCount = lineItemsData.length;
      
      if (lineItemsData.length === 0) {
        console.log("No line items found for Leeds location");
        
        debug.endTime = new Date().toISOString();
        debug.timeTaken = (new Date(debug.endTime).getTime() - new Date(debug.fetchStartTime).getTime()) / 1000;
        setDebugInfo({ 
          ...debug, 
          lineItemsFetchResult: "No line items found for Leeds location",
          allLineItems: allLineItemsData?.length || 0
        });
        setOrders([]);
        setIsLoading(false);
        return;
      }
      
      // Get all unique SKUs for stock lookup
      const skus = extractUniqueSkus(lineItemsData);
      
      // Step 4: Get stock information for these SKUs
      const stockData = await fetchStockForSkus(skus);
      
      // Create a lookup map for stock data
      const stockMap = createStockMap(stockData || []);
      
      // Process the data to combine all information
      const processedOrders = processPickedOrdersData(ordersData, lineItemsData, stockMap, progressMap);
      
      console.log(`Processed ${processedOrders.length} orders with ${processedOrders.reduce((count, order) => count + order.items.length, 0)} picked items`);
      debug.finalOrderCount = processedOrders.length;
      debug.finalItemCount = processedOrders.reduce((count, order) => count + order.items.length, 0);
      
      debug.endTime = new Date().toISOString();
      debug.timeTaken = (new Date(debug.endTime).getTime() - new Date(debug.fetchStartTime).getTime()) / 1000;
      setDebugInfo(debug);
      setOrders(processedOrders);
    } catch (err: any) {
      console.error("Error fetching picked items data:", err);
      setError(err.message);
      debug.endTime = new Date().toISOString();
      debug.timeTaken = (new Date(debug.endTime).getTime() - new Date(debug.fetchStartTime).getTime()) / 1000;
      setDebugInfo({ ...debug, error: err.message });
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);
  
  return {
    orders,
    isLoading,
    error,
    refreshData: fetchData,
    debugInfo
  };
};
