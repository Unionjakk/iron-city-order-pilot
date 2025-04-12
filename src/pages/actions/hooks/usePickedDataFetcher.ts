
import { useState } from "react";
import { PicklistDebugInfo } from "../types/picklistTypes";
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
  fetchPickedItemsProgress
} from "../services/pickedDataService";
import { processPickedOrdersData } from "../utils/pickedDataProcessingUtils";

/**
 * Hook to handle data fetching for picked items
 */
export const usePickedDataFetcher = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<PicklistDebugInfo>({} as PicklistDebugInfo);

  /**
   * Fetch all picked items data
   */
  const fetchPickedData = async () => {
    setIsLoading(true);
    setError(null);
    
    const debug: PicklistDebugInfo = {
      orderCount: 0,
      lineItemCount: 0,
      progressItemCount: 0,
      finalOrderCount: 0,
      finalItemCount: 0,
      orderStatus: [],
      fetchStartTime: new Date().toISOString(),
      endTime: '',
      timeTaken: 0
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
        setIsLoading(false);
        return { orders: [], debug };
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
        setIsLoading(false);
        return { orders: [], debug };
      }
      
      // Step 3: Get all line items for these orders that are at Leeds location
      const orderIds = ordersData.map(order => order.id);
      
      // First get all line items for the orders
      const allLineItemsData = await fetchLineItemsForOrders(orderIds);
      
      console.log(`Found ${allLineItemsData?.length || 0} total line items for all orders`);
      debug.allLineItems = allLineItemsData?.length || 0;
      
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
        setIsLoading(false);
        return { orders: [], debug };
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
      console.log("Sample processed order:", processedOrders.length > 0 ? processedOrders[0] : "No orders");
      
      debug.finalOrderCount = processedOrders.length;
      debug.finalItemCount = processedOrders.reduce((count, order) => count + order.items.length, 0);
      
      debug.endTime = new Date().toISOString();
      debug.timeTaken = (new Date(debug.endTime).getTime() - new Date(debug.fetchStartTime).getTime()) / 1000;
      setDebugInfo(debug);
      setIsLoading(false);
      
      return { 
        orders: processedOrders, 
        debug 
      };
    } catch (err: any) {
      console.error("Error fetching picked items data:", err);
      setError(err.message);
      debug.endTime = new Date().toISOString();
      debug.timeTaken = (new Date(debug.endTime).getTime() - new Date(debug.fetchStartTime).getTime()) / 1000;
      setDebugInfo({ ...debug, error: err.message });
      setIsLoading(false);
      return { orders: [], debug };
    }
  };

  return {
    fetchPickedData,
    isLoading,
    error,
    debugInfo,
    setIsLoading,
    setError,
    setDebugInfo
  };
};
