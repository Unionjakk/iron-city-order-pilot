
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
  fetchOrdersWithOrderedItems,
  fetchOrderedItemsProgress
} from "../services/orderedDataService";
import {
  fetchLineItemsForOrders,
  fetchStockForSkus
} from "../services/toOrderDataService";

/**
 * Hook to fetch and manage "Ordered" data
 */
export const useOrderedData = (): PicklistDataResult => {
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
      console.log("Fetching 'Ordered' data for Leeds location ID:", LEEDS_LOCATION_ID);
      
      // Step 1: Get the progress data first (items marked as "Ordered")
      const progressData = await fetchOrderedItemsProgress();
      
      console.log(`Found ${progressData?.length || 0} items with 'Ordered' progress data`);
      debug.progressItemCount = progressData?.length || 0;
      debug.progressItems = progressData?.slice(0, 5);
      
      // If no "Ordered" items, return early
      if (!progressData || progressData.length === 0) {
        console.log("No items found with 'Ordered' progress");
        debug.endTime = new Date().toISOString();
        debug.timeTaken = (new Date(debug.endTime).getTime() - new Date(debug.fetchStartTime).getTime()) / 1000;
        setDebugInfo({ ...debug, progressFetchResult: "No 'Ordered' items found" });
        setOrders([]);
        setIsLoading(false);
        return;
      }
      
      // Create a lookup map for progress data
      const progressMap = createProgressMap(progressData);
      
      // Step 2: Get all unfulfilled orders that have "Ordered" items
      const ordersData = await fetchOrdersWithOrderedItems();
      
      // Save first few order statuses for debugging
      debug.orderStatus = ordersData?.slice(0, 5).map(o => ({
        id: o.shopify_order_id,
        status: o.status,
        number: o.shopify_order_number
      }));
      
      if (!ordersData || ordersData.length === 0) {
        console.log("No orders found with 'Ordered' items");
        debug.endTime = new Date().toISOString();
        debug.timeTaken = (new Date(debug.endTime).getTime() - new Date(debug.fetchStartTime).getTime()) / 1000;
        setDebugInfo({ ...debug, ordersFetchResult: "No orders found with 'Ordered' items" });
        setOrders([]);
        setIsLoading(false);
        return;
      }
      
      console.log(`Found ${ordersData.length} orders with 'Ordered' items`);
      debug.orderCount = ordersData.length;
      
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
        
        // Add detail about the locations found
        debug.locationDistribution = {};
        allLineItemsData?.forEach(item => {
          const locId = item.location_id || 'null';
          debug.locationDistribution[locId] = (debug.locationDistribution[locId] || 0) + 1;
        });
        
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
      
      // Process the data into the final format
      const processedOrders = processOrderedData(
        ordersData, 
        lineItemsData, 
        stockMap, 
        progressMap,
        debug
      );
      
      debug.endTime = new Date().toISOString();
      debug.timeTaken = (new Date(debug.endTime).getTime() - new Date(debug.fetchStartTime).getTime()) / 1000;
      setDebugInfo(debug);
      setOrders(processedOrders);
    } catch (err: any) {
      console.error("Error fetching ordered data:", err);
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

/**
 * Process the fetched data into the final order format
 */
const processOrderedData = (
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
  const processedLineItems = lineItemsData.map(item => {
    const stock = stockMap.get(item.sku);
    
    // Use the shopify_order_id (not order_id) to look up progress
    const shopifyOrderId = orderIdToShopifyOrderId[item.order_id];
    if (!shopifyOrderId) {
      console.log(`Warning: No shopify_order_id found for order_id ${item.order_id}`);
    }
    
    // Debug - try to match progress for "No SKU" items
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
  
  // Group line items by order
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
  
  // Add line items to their respective orders, but ONLY if they have "Ordered" progress
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
  
  console.log(`Debug - Found ${orderedItemCount} items with "Ordered" progress`);
  
  // Convert the map to an array of orders
  const resultOrders = Array.from(orderMap.values());
  
  // Filter out orders with no items (all items might have been filtered out if none had "Ordered" progress)
  const finalOrders = resultOrders.filter(order => order.items.length > 0);
  
  console.log(`Final processing: ${finalOrders.length} orders with ${finalOrders.reduce((count, order) => count + order.items.length, 0)} Ordered items`);
  debug.finalOrderCount = finalOrders.length;
  debug.finalItemCount = finalOrders.reduce((count, order) => count + order.items.length, 0);
  
  return finalOrders;
};
