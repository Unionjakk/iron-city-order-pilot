
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
  fetchUnfulfilledOrders,
  fetchLineItemsForOrders,
  fetchStockForSkus,
  fetchProgressForOrders,
  checkOrderStatuses
} from "../services/picklistDataService";

/**
 * Hook to fetch and manage picklist data
 */
export const usePicklistData = (): PicklistDataResult => {
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
      console.log("Fetching picklist data for Leeds location ID:", LEEDS_LOCATION_ID);
      
      // Step 1: Get all unfulfilled orders
      const ordersData = await fetchUnfulfilledOrders();
      
      // Save first few order statuses for debugging
      debug.orderStatus = ordersData?.slice(0, 5).map(o => ({
        id: o.shopify_order_id,
        status: o.status,
        number: o.shopify_order_number
      }));
      
      if (!ordersData || ordersData.length === 0) {
        console.log("No orders found with status 'unfulfilled'");
        
        // Double-check what order statuses exist
        debug.availableStatuses = await checkOrderStatuses();
        
        debug.endTime = new Date().toISOString();
        debug.timeTaken = (new Date(debug.endTime).getTime() - new Date(debug.fetchStartTime).getTime()) / 1000;
        setDebugInfo({ ...debug, ordersFetchResult: "No orders found" });
        setOrders([]);
        setIsLoading(false);
        return;
      }
      
      console.log(`Found ${ordersData.length} orders with status 'unfulfilled'`);
      debug.orderCount = ordersData.length;
      
      // Step 2: Get all line items for these orders that are at Leeds location
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
        
        debug.lineItemsFirstFew = allLineItemsData?.slice(0, 5).map(item => ({
          id: item.id,
          location_id: item.location_id,
          sku: item.sku,
          title: item.title
        }));
        
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
      
      // Step 3: Get stock information for these SKUs
      const stockData = await fetchStockForSkus(skus);
      
      // Create a lookup map for stock data
      const stockMap = createStockMap(stockData || []);
      
      // Step 4: Get progress information for line items
      const progressData = await fetchProgressForOrders(ordersData.map(o => o.shopify_order_id));
      
      // Create a lookup map for progress data
      const progressMap = createProgressMap(progressData || []);
      
      console.log(`Found ${progressData?.length || 0} items with progress data`);
      debug.progressItemCount = progressData?.length || 0;
      debug.progressItems = progressData?.slice(0, 5);
      
      // Process the data to combine all information
      const processedOrders = processOrdersData(ordersData, lineItemsData, stockMap, progressMap);
      
      console.log(`Processed ${processedOrders.length} orders with ${processedOrders.reduce((count, order) => count + order.items.length, 0)} items`);
      debug.finalOrderCount = processedOrders.length;
      debug.finalItemCount = processedOrders.reduce((count, order) => count + order.items.length, 0);
      
      debug.endTime = new Date().toISOString();
      debug.timeTaken = (new Date(debug.endTime).getTime() - new Date(debug.fetchStartTime).getTime()) / 1000;
      setDebugInfo(debug);
      setOrders(processedOrders);
    } catch (err: any) {
      console.error("Error fetching picklist data:", err);
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

// Re-export types for convenience
export type { PicklistOrder, PicklistOrderItem } from "../types/picklistTypes";
