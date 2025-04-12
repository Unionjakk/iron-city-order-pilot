
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
  fetchOrderedItemsProgress,
  initializeDebugInfo,
  finalizeDebugInfo
} from "../services/orderedDataService";
import {
  fetchLineItemsForOrders,
  fetchStockForSkus
} from "../services/toOrderDataService";
import { processOrderedData } from "../utils/orderedDataProcessingUtils";

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
    
    // Initialize debug information
    const debug = initializeDebugInfo();
    
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
        setDebugInfo({ 
          ...finalizeDebugInfo(debug), 
          progressFetchResult: "No 'Ordered' items found" 
        });
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
        setDebugInfo({ 
          ...finalizeDebugInfo(debug), 
          ordersFetchResult: "No orders found with 'Ordered' items" 
        });
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
        
        setDebugInfo({
          ...finalizeDebugInfo(debug),
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
      
      setDebugInfo(finalizeDebugInfo(debug));
      setOrders(processedOrders);
    } catch (err: any) {
      console.error("Error fetching ordered data:", err);
      setError(err.message);
      setDebugInfo({ 
        ...finalizeDebugInfo(debug), 
        error: err.message 
      });
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
