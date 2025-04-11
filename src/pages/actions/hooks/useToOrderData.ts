import { useState, useEffect } from "react";
import { PicklistOrder, PicklistDebugInfo, PicklistDataResult } from "../types/picklistTypes";
import { LEEDS_LOCATION_ID } from "../constants/picklistConstants";
import { 
  processOrdersData,
  extractUniqueSkus,
  createProgressMap,
  createStockMap,
  filterLeedsLineItems
} from "../utils/picklistDataUtils";
import {
  fetchOrdersWithToOrderItems,
  fetchLineItemsForOrders,
  fetchStockForSkus,
  fetchToOrderItemsProgress
} from "../services/toOrderDataService";

/**
 * Hook to fetch and manage "To Order" data
 */
export const useToOrderData = (): PicklistDataResult => {
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
      console.log("Fetching 'To Order' data for Leeds location ID:", LEEDS_LOCATION_ID);
      
      // Step 1: Get the progress data first (orders marked as "To Order")
      const progressData = await fetchToOrderItemsProgress();
      
      console.log(`Found ${progressData?.length || 0} items with 'To Order' progress data`);
      debug.progressItemCount = progressData?.length || 0;
      debug.progressItems = progressData?.slice(0, 5);
      
      // If no "To Order" items, return early
      if (!progressData || progressData.length === 0) {
        console.log("No items found with 'To Order' progress");
        debug.endTime = new Date().toISOString();
        debug.timeTaken = (new Date(debug.endTime).getTime() - new Date(debug.fetchStartTime).getTime()) / 1000;
        setDebugInfo({ ...debug, progressFetchResult: "No 'To Order' items found" });
        setOrders([]);
        setIsLoading(false);
        return;
      }
      
      // Create a lookup map for progress data
      const progressMap = createProgressMap(progressData);
      
      // Step 2: Get all unfulfilled orders that have "To Order" items
      const ordersData = await fetchOrdersWithToOrderItems();
      
      // Save first few order statuses for debugging
      debug.orderStatus = ordersData?.slice(0, 5).map(o => ({
        id: o.shopify_order_id,
        status: o.status,
        number: o.shopify_order_number
      }));
      
      if (!ordersData || ordersData.length === 0) {
        console.log("No orders found with 'To Order' items");
        debug.endTime = new Date().toISOString();
        debug.timeTaken = (new Date(debug.endTime).getTime() - new Date(debug.fetchStartTime).getTime()) / 1000;
        setDebugInfo({ ...debug, ordersFetchResult: "No orders found with 'To Order' items" });
        setOrders([]);
        setIsLoading(false);
        return;
      }
      
      console.log(`Found ${ordersData.length} orders with 'To Order' items`);
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
      
      // Process the data to combine all information
      const processedOrders = processOrdersData(ordersData, lineItemsData, stockMap, progressMap);
      
      // Final filter - only keep orders that have at least one item with "To Order" progress
      const finalOrders = processedOrders.map(order => {
        // Filter items to only those with "To Order" progress
        const toOrderItems = order.items.filter(item => item.progress === "To Order");
        
        // Return a new order with only the "To Order" items
        return {
          ...order,
          items: toOrderItems
        };
      }).filter(order => order.items.length > 0);
      
      console.log(`Final processing: ${finalOrders.length} orders with ${finalOrders.reduce((count, order) => count + order.items.length, 0)} To Order items`);
      debug.finalOrderCount = finalOrders.length;
      debug.finalItemCount = finalOrders.reduce((count, order) => count + order.items.length, 0);
      
      debug.endTime = new Date().toISOString();
      debug.timeTaken = (new Date(debug.endTime).getTime() - new Date(debug.fetchStartTime).getTime()) / 1000;
      setDebugInfo(debug);
      setOrders(finalOrders);
    } catch (err: any) {
      console.error("Error fetching to order data:", err);
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
