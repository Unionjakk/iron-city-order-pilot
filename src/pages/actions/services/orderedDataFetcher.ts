
import { LEEDS_LOCATION_ID } from "../constants/picklistConstants";
import { PicklistDebugInfo } from "../types/picklistTypes";
import { 
  fetchOrdersWithOrderedItems,
  fetchOrderedItemsProgress,
  finalizeDebugInfo
} from "../services/orderedDataService";
import {
  fetchLineItemsForOrders,
  fetchStockForSkus
} from "../services/toOrderDataService";
import {
  createProgressMap,
  createStockMap,
  extractUniqueSkus,
  filterLeedsLineItems
} from "../utils/picklistDataUtils";

/**
 * Service to fetch all data required for ordered items
 */
export const fetchOrderedData = async (debug: PicklistDebugInfo) => {
  console.log("Fetching 'Ordered' data for Leeds location ID:", LEEDS_LOCATION_ID);
  
  // Step 1: Get the progress data first (items marked as "Ordered")
  const progressData = await fetchOrderedItemsProgress();
  
  console.log(`Found ${progressData?.length || 0} items with 'Ordered' progress data`);
  debug.progressItemCount = progressData?.length || 0;
  debug.progressItems = progressData?.slice(0, 5);
  
  // If no "Ordered" items, return early
  if (!progressData || progressData.length === 0) {
    console.log("No items found with 'Ordered' progress");
    return {
      ordersData: [],
      lineItemsData: [],
      stockMap: new Map(),
      progressMap: new Map(),
      debug: {
        ...finalizeDebugInfo(debug),
        progressFetchResult: "No 'Ordered' items found"
      }
    };
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
    return {
      ordersData: [],
      lineItemsData: [],
      stockMap: new Map(),
      progressMap,
      debug: {
        ...finalizeDebugInfo(debug),
        ordersFetchResult: "No orders found with 'Ordered' items"
      }
    };
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
    
    return {
      ordersData: [],
      lineItemsData: [],
      stockMap: new Map(),
      progressMap,
      debug: {
        ...finalizeDebugInfo(debug),
        lineItemsFetchResult: "No line items found for Leeds location",
        allLineItems: allLineItemsData?.length || 0
      }
    };
  }
  
  // Get all unique SKUs for stock lookup
  const skus = extractUniqueSkus(lineItemsData);
  
  // Step 4: Get stock information for these SKUs
  const stockData = await fetchStockForSkus(skus);
  
  // Create a lookup map for stock data
  const stockMap = createStockMap(stockData || []);
  
  return {
    ordersData,
    lineItemsData,
    stockMap,
    progressMap,
    debug
  };
};
