
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PicklistOrderItem {
  id: string;
  order_id: string;
  shopify_line_item_id: string;
  sku: string;
  title: string;
  quantity: number;
  price: number | null;
  created_at: string;
  location_id: string;
  location_name: string | null;
  // Pinnacle stock data
  in_stock: boolean;
  stock_quantity: number | null;
  bin_location: string | null;
  cost: number | null;
  // Progress tracking
  progress: string | null;
  notes: string | null;
}

export interface PicklistOrder {
  id: string;
  shopify_order_id: string;
  shopify_order_number: string | null;
  customer_name: string;
  customer_email: string | null;
  created_at: string;
  items: PicklistOrderItem[];
}

export const usePicklistData = () => {
  const [orders, setOrders] = useState<PicklistOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  const LEEDS_LOCATION_ID = "53277786267";

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    const debug: any = {
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
      
      if (ordersError) throw new Error(`Orders fetch error: ${ordersError.message}`);
      
      // Save first few order statuses for debugging
      debug.orderStatus = ordersData?.slice(0, 5).map(o => ({
        id: o.shopify_order_id,
        status: o.status,
        number: o.shopify_order_number
      }));
      
      if (!ordersData || ordersData.length === 0) {
        console.log("No orders found with status 'unfulfilled'");
        
        // Double-check what order statuses exist
        const { data: statusCheck } = await supabase
          .from('shopify_orders')
          .select('status')
          .limit(20);
          
        debug.availableStatuses = Array.from(new Set(statusCheck?.map(s => s.status)));
        
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
      const { data: allLineItemsData, error: allLineItemsError } = await supabase
        .from('shopify_order_items')
        .select('*')
        .in('order_id', orderIds);
      
      if (allLineItemsError) throw new Error(`All line items fetch error: ${allLineItemsError.message}`);
      
      console.log(`Found ${allLineItemsData?.length || 0} total line items for all orders`);
      debug.totalLineItems = allLineItemsData?.length || 0;
      
      // Now filter for Leeds location
      const lineItemsData = allLineItemsData?.filter(item => 
        item.location_id === LEEDS_LOCATION_ID
      ) || [];
      
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
      const skus = [...new Set(lineItemsData.map(item => item.sku).filter(Boolean))];
      
      // Step 3: Get stock information for these SKUs
      const { data: stockData, error: stockError } = await supabase
        .from('pinnacle_stock')
        .select('part_no, stock_quantity, bin_location, cost')
        .in('part_no', skus);
        
      if (stockError) throw new Error(`Stock fetch error: ${stockError.message}`);
      
      // Create a lookup map for stock data
      const stockMap = new Map();
      stockData?.forEach(stock => {
        stockMap.set(stock.part_no, stock);
      });
      
      // Step 4: Get progress information for line items
      const { data: progressData, error: progressError } = await supabase
        .from('iron_city_order_progress')
        .select('shopify_order_id, sku, progress, notes')
        .in('shopify_order_id', ordersData.map(o => o.shopify_order_id));
        
      if (progressError) throw new Error(`Progress fetch error: ${progressError.message}`);
      
      // Create a lookup map for progress data
      const progressMap = new Map();
      progressData?.forEach(progress => {
        const key = `${progress.shopify_order_id}_${progress.sku}`;
        progressMap.set(key, progress);
      });
      
      console.log(`Found ${progressData?.length || 0} items with progress data`);
      debug.progressItemCount = progressData?.length || 0;
      debug.progressItems = progressData?.slice(0, 5);
      
      // Process the data to combine all information
      const processedOrders = ordersData
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
              };
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
          };
        })
        .filter(Boolean); // Remove orders with no items
      
      console.log(`Processed ${processedOrders.length} orders with ${processedOrders.reduce((count, order) => count + order.items.length, 0)} items`);
      debug.finalOrderCount = processedOrders.length;
      debug.finalItemCount = processedOrders.reduce((count, order) => count + order.items.length, 0);
      
      debug.endTime = new Date().toISOString();
      debug.timeTaken = (new Date(debug.endTime).getTime() - new Date(debug.fetchStartTime).getTime()) / 1000;
      setDebugInfo(debug);
      setOrders(processedOrders as PicklistOrder[]);
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
