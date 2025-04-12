
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PicklistOrder, PicklistOrderItem, PicklistDataResult } from "../types/picklistTypes";
import { LEEDS_LOCATION_ID } from "../constants/picklistConstants";
import { 
  extractUniqueSkus,
  createStockMap,
  filterLeedsLineItems
} from "../utils/picklistDataUtils";

/**
 * Interface for visualizer-specific data
 */
export interface OrderVisualizerData extends PicklistDataResult {
  statusCounts: {
    toPick: number;
    picking: number;
    picked: number;
    toOrder: number;
    ordered: number;
    toDispatch: number;
    fulfilled: number;
    other: number;
  };
  lastRefreshTime: string | null;
}

/**
 * Hook to fetch and manage all order data for visualization
 */
export const useVisualizerData = (): OrderVisualizerData => {
  const [orders, setOrders] = useState<PicklistOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [statusCounts, setStatusCounts] = useState({
    toPick: 0,
    picking: 0,
    picked: 0,
    toOrder: 0,
    ordered: 0,
    toDispatch: 0,
    fulfilled: 0,
    other: 0
  });
  const [lastRefreshTime, setLastRefreshTime] = useState<string | null>(null);

  const fetchVisualizerData = async () => {
    setIsLoading(true);
    setError(null);
    
    const debug = {
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
      console.log("Fetching all orders data for Leeds location ID:", LEEDS_LOCATION_ID);
      
      // Step 1: Get the last refresh time from settings
      const { data: settingsData } = await supabase
        .from('shopify_settings')
        .select('setting_value')
        .eq('setting_name', 'last_sync_time')
        .single();
      
      if (settingsData) {
        setLastRefreshTime(settingsData.setting_value);
      }
      
      // Step 2: Get all unfulfilled orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('shopify_orders')
        .select(`
          id,
          shopify_order_id,
          shopify_order_number,
          customer_name,
          customer_email,
          created_at,
          status
        `)
        .eq('status', 'unfulfilled');
      
      if (ordersError) {
        throw new Error(`Orders fetch error: ${ordersError.message}`);
      }
      
      debug.orderCount = ordersData?.length || 0;
      debug.orderStatus = ordersData?.slice(0, 5).map(o => 
        `${o.shopify_order_id} (${o.status}, ${o.shopify_order_number || 'No number'})`
      );
      
      if (!ordersData || ordersData.length === 0) {
        console.log("No unfulfilled orders found");
        debug.endTime = new Date().toISOString();
        debug.timeTaken = (new Date(debug.endTime).getTime() - new Date(debug.fetchStartTime).getTime()) / 1000;
        setDebugInfo(debug);
        setOrders([]);
        setIsLoading(false);
        return;
      }
      
      console.log(`Found ${ordersData.length} unfulfilled orders`);
      
      // Step 3: Get all line items for these orders
      const orderIds = ordersData.map(order => order.id);
      
      const { data: allLineItemsData, error: lineItemsError } = await supabase
        .from('shopify_order_items')
        .select('*')
        .in('order_id', orderIds);
      
      if (lineItemsError) {
        throw new Error(`Line items fetch error: ${lineItemsError.message}`);
      }
      
      debug.totalLineItems = allLineItemsData?.length || 0;
      
      // Filter for Leeds location only
      const lineItemsData = filterLeedsLineItems(allLineItemsData || []);
      debug.lineItemCount = lineItemsData.length;
      
      if (lineItemsData.length === 0) {
        console.log("No line items found for Leeds location");
        debug.endTime = new Date().toISOString();
        debug.timeTaken = (new Date(debug.endTime).getTime() - new Date(debug.fetchStartTime).getTime()) / 1000;
        setDebugInfo({ 
          ...debug, 
          lineItemsFetchResult: "No line items found for Leeds location" 
        });
        setOrders([]);
        setIsLoading(false);
        return;
      }
      
      // Step 4: Get stock information
      const skus = extractUniqueSkus(lineItemsData);
      
      const { data: stockData, error: stockError } = await supabase
        .from('pinnacle_stock')
        .select('part_no, stock_quantity, bin_location, cost')
        .in('part_no', skus);
      
      if (stockError) {
        throw new Error(`Stock fetch error: ${stockError.message}`);
      }
      
      const stockMap = createStockMap(stockData || []);
      
      // Step 5: Get ALL progress data for these orders (not filtered by status)
      const { data: progressData, error: progressError } = await supabase
        .from('iron_city_order_progress')
        .select('shopify_order_id, sku, progress, notes, quantity, quantity_required, quantity_picked, is_partial, hd_orderlinecombo, status, dealer_po_number')
        .in('shopify_order_id', ordersData.map(o => o.shopify_order_id));
      
      if (progressError) {
        throw new Error(`Progress fetch error: ${progressError.message}`);
      }
      
      debug.progressItemCount = progressData?.length || 0;
      
      // Step 6: Process and merge all data
      const processedOrders: PicklistOrder[] = [];
      const statusCountData = {
        toPick: 0,
        picking: 0,
        picked: 0,
        toOrder: 0,
        ordered: 0,
        toDispatch: 0,
        fulfilled: 0,
        other: 0
      };
      
      // Create a lookup map for progress data
      const progressByOrderAndSku = new Map<string, any>();
      progressData?.forEach(item => {
        const key = `${item.shopify_order_id}_${item.sku}`;
        progressByOrderAndSku.set(key, item);
      });
      
      // Process each order
      ordersData.forEach(order => {
        // Get line items for this order
        const orderItems = lineItemsData.filter(item => item.order_id === order.id);
        
        if (orderItems.length === 0) return; // Skip if no items for Leeds location
        
        // Process each line item
        const processedItems: PicklistOrderItem[] = [];
        
        orderItems.forEach(item => {
          const stock = stockMap.get(item.sku);
          
          // Look up progress for this item
          const progressKey = `${order.shopify_order_id}_${item.sku}`;
          const progressItem = progressByOrderAndSku.get(progressKey);
          
          // Default progress values
          let progress = progressItem?.progress || "To Pick";
          let notes = progressItem?.notes || null;
          let quantity_required = progressItem?.quantity_required || item.quantity;
          let quantity_picked = progressItem?.quantity_picked || 0;
          let is_partial = progressItem?.is_partial || false;
          let hd_orderlinecombo = progressItem?.hd_orderlinecombo || null;
          let status = progressItem?.status || null;
          let dealer_po_number = progressItem?.dealer_po_number || null;
          
          // Count progress status
          if (progress === "To Pick") statusCountData.toPick++;
          else if (progress === "Picking") statusCountData.picking++;
          else if (progress === "Picked") statusCountData.picked++;
          else if (progress === "To Order") statusCountData.toOrder++;
          else if (progress === "Ordered") statusCountData.ordered++;
          else if (progress === "To Dispatch") statusCountData.toDispatch++;
          else if (progress === "Fulfilled") statusCountData.fulfilled++;
          else statusCountData.other++;
          
          // Create processed item
          processedItems.push({
            ...item,
            // Stock data
            in_stock: !!stock,
            stock_quantity: stock?.stock_quantity || null,
            bin_location: stock?.bin_location || null,
            cost: stock?.cost || null,
            // Progress data
            progress,
            notes,
            hd_orderlinecombo,
            status,
            dealer_po_number,
            // Quantity tracking
            quantity_required,
            quantity_picked,
            is_partial
          });
        });
        
        if (processedItems.length > 0) {
          processedOrders.push({
            id: order.id,
            shopify_order_id: order.shopify_order_id,
            shopify_order_number: order.shopify_order_number,
            customer_name: order.customer_name,
            customer_email: order.customer_email,
            created_at: order.created_at,
            items: processedItems
          });
        }
      });
      
      debug.finalOrderCount = processedOrders.length;
      debug.finalItemCount = processedOrders.reduce((count, order) => count + order.items.length, 0);
      
      debug.endTime = new Date().toISOString();
      debug.timeTaken = (new Date(debug.endTime).getTime() - new Date(debug.fetchStartTime).getTime()) / 1000;
      
      // Set state with processed data
      setDebugInfo(debug);
      setOrders(processedOrders);
      setStatusCounts(statusCountData);
      
    } catch (err: any) {
      console.error("Error fetching visualizer data:", err);
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
    fetchVisualizerData();
  }, []);
  
  return {
    orders,
    isLoading,
    error,
    refreshData: fetchVisualizerData,
    debugInfo,
    statusCounts,
    lastRefreshTime
  };
};
