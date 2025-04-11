
import { PickStatsData } from "@/components/stats/PickStats";
import { supabase } from "@/integrations/supabase/client";

// Fetch stats data for Pick Stats from the cached stats table
export const fetchPickStatsData = async (): Promise<PickStatsData> => {
  try {
    console.log("Fetching Pick Stats data from cache");
    
    // Get the cached stats from our new function
    const { data, error } = await supabase
      .rpc('get_dashboard_stats', { stats_type_param: 'pick' });
      
    if (error) throw error;
    
    if (!data) {
      throw new Error("No cached Pick Stats data available");
    }
    
    // Log the raw data to debug what's being returned
    console.log("Raw Pick Stats data:", data);
    
    // Ensure data is the expected object type
    const statsData = data as Record<string, any>;
    
    // Convert the returned JSON data to the expected type with fallbacks
    return {
      totalOrdersToPick: typeof statsData.totalOrdersToPick === 'number' ? statsData.totalOrdersToPick : 0,
      totalItemsToPick: typeof statsData.totalItemsToPick === 'number' ? statsData.totalItemsToPick : 0,
      averagePickTime: typeof statsData.averagePickTime === 'string' ? statsData.averagePickTime : "0m",
      readyToPick: typeof statsData.readyToPick === 'number' ? statsData.readyToPick : 0,
      pendingItems: typeof statsData.pendingItems === 'number' ? statsData.pendingItems : 0,
      outOfStock: typeof statsData.outOfStock === 'number' ? statsData.outOfStock : 0,
      ordersProcessedToday: typeof statsData.ordersProcessedToday === 'number' ? statsData.ordersProcessedToday : 0
    };
  } catch (error) {
    console.error("Error fetching Pick Stats data:", error);
    throw new Error("Failed to fetch Pick Stats data");
  }
};

// Custom function to fetch accurate Pick Stats data directly, bypassing the cached stats
export const fetchAccuratePickStatsData = async (): Promise<PickStatsData> => {
  try {
    console.log("Fetching accurate Pick Stats data directly");
    
    // Instead of using the get_picklist_stats RPC function, we'll query directly
    // First get all order items that don't have a progress entry - these need to be picked
    const { data: itemsNeedingPick, error: itemsError } = await supabase
      .from('shopify_order_items')
      .select(`
        order_id,
        sku,
        quantity,
        shopify_orders!inner(
          shopify_order_id,
          status
        )
      `)
      .eq('shopify_orders.status', 'imported')
      .not('shopify_orders.status', 'eq', 'archived');
      
    if (itemsError) throw itemsError;
    
    // Log the raw data to debug
    console.log("Raw items needing pick:", itemsNeedingPick);
    
    if (!itemsNeedingPick) {
      return {
        totalOrdersToPick: 0,
        totalItemsToPick: 0,
        averagePickTime: "14m",
        readyToPick: 0,
        pendingItems: 0,
        outOfStock: 0,
        ordersProcessedToday: 0
      };
    }
    
    // Filter out items that already have progress entries
    const { data: progressEntries, error: progressError } = await supabase
      .from('iron_city_order_progress')
      .select('shopify_order_id, sku');
      
    if (progressError) throw progressError;
    
    // Create a set of order_id+sku combinations that have progress entries
    const progressSet = new Set();
    progressEntries?.forEach(entry => {
      progressSet.add(`${entry.shopify_order_id}:${entry.sku}`);
    });
    
    // Filter out items with progress entries
    const filteredItems = itemsNeedingPick.filter(item => {
      const orderSku = `${item.shopify_orders.shopify_order_id}:${item.sku}`;
      return !progressSet.has(orderSku);
    });
    
    // Get stock quantities for the SKUs
    const skus = [...new Set(filteredItems.map(item => item.sku))];
    const { data: stockData, error: stockError } = await supabase
      .from('pinnacle_stock')
      .select('part_no, stock_quantity')
      .in('part_no', skus);
      
    if (stockError) throw stockError;
    
    // Create a map of SKU to stock quantity
    const stockMap = new Map();
    stockData?.forEach(item => {
      stockMap.set(item.part_no, item.stock_quantity);
    });
    
    // Calculate stats
    const uniqueOrders = new Set(filteredItems.map(item => item.shopify_orders.shopify_order_id));
    const totalItems = filteredItems.length;
    
    let readyToPick = 0;
    let pendingItems = 0;
    let outOfStock = 0;
    
    filteredItems.forEach(item => {
      const stockQuantity = stockMap.get(item.sku);
      if (stockQuantity === undefined || stockQuantity <= 0) {
        pendingItems++;
        if (stockQuantity === 0) {
          outOfStock++;
        }
      } else {
        readyToPick++;
      }
    });
    
    // Get count of orders processed today
    const { data: processedToday, error: processedError } = await supabase
      .from('iron_city_order_progress')
      .select('shopify_order_id')
      .eq('progress', 'Picked')
      .gte('updated_at', new Date().toISOString().split('T')[0]);
      
    if (processedError) throw processedError;
    
    // Get unique order IDs processed today
    const uniqueOrdersProcessed = processedToday 
      ? [...new Set(processedToday.map(item => item.shopify_order_id))].length 
      : 0;
    
    return {
      totalOrdersToPick: uniqueOrders.size,
      totalItemsToPick: totalItems,
      averagePickTime: "14m", // Hardcoded for now
      readyToPick,
      pendingItems,
      outOfStock,
      ordersProcessedToday: uniqueOrdersProcessed
    };
  } catch (error) {
    console.error("Error fetching accurate Pick Stats data:", error);
    throw new Error("Failed to fetch accurate Pick Stats data");
  }
};
