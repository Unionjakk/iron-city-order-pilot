
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
  created_at: string;
  items: PicklistOrderItem[];
}

export const usePicklistData = () => {
  const [orders, setOrders] = useState<PicklistOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const LEEDS_LOCATION_ID = "53277786267";

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Step 1: Get all unfulfilled orders with items at Leeds location
      const { data: ordersData, error: ordersError } = await supabase
        .from('shopify_orders')
        .select(`
          id,
          shopify_order_id,
          shopify_order_number,
          customer_name,
          created_at
        `)
        .eq('status', 'imported');
      
      if (ordersError) throw new Error(`Orders fetch error: ${ordersError.message}`);
      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        setIsLoading(false);
        return;
      }
      
      // Step 2: Get all line items for these orders
      const orderIds = ordersData.map(order => order.id);
      const { data: lineItemsData, error: lineItemsError } = await supabase
        .from('shopify_order_items')
        .select('*')
        .in('order_id', orderIds)
        .eq('location_id', LEEDS_LOCATION_ID);
      
      if (lineItemsError) throw new Error(`Line items fetch error: ${lineItemsError.message}`);
      
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
              if (progress?.progress) return null;
              
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
            created_at: order.created_at,
            items: orderItems
          };
        })
        .filter(Boolean); // Remove orders with no items
      
      setOrders(processedOrders as PicklistOrder[]);
    } catch (err: any) {
      console.error("Error fetching picklist data:", err);
      setError(err.message);
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
    refreshData: fetchData
  };
};
