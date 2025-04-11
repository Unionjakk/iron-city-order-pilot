
import { PickStatsData } from "@/components/stats/PickStats";
import { supabase } from "@/integrations/supabase/client";

// Fetch real data for Pick Stats from the database
export const fetchPickStatsData = async (): Promise<PickStatsData> => {
  try {
    console.log("Fetching real Pick Stats data from database");
    
    // Get total orders to pick (orders with items that have "To Pick" progress)
    const { data: toPickData, error: toPickError } = await supabase
      .from('iron_city_order_progress')
      .select('shopify_order_id')
      .eq('progress', 'To Pick');
      
    if (toPickError) throw toPickError;
    
    // Get unique order count
    const uniqueOrderIds = [...new Set(toPickData?.map(item => item.shopify_order_id))];
    const totalOrdersToPick = uniqueOrderIds.length;
    
    // Get total items to pick
    const totalItemsToPick = toPickData?.length || 0;
    
    // Get ready to pick count (these are items with "Ready" status in stock)
    const { data: readyItems, error: readyError } = await supabase
      .from('iron_city_order_progress')
      .select('id, sku')
      .eq('progress', 'To Pick');
      
    if (readyError) throw readyError;
    
    // For each item, check stock quantity
    let readyToPick = 0;
    
    if (readyItems && readyItems.length > 0) {
      for (const item of readyItems) {
        const { data: stockData, error: stockError } = await supabase
          .from('pinnacle_stock')
          .select('stock_quantity')
          .eq('part_no', item.sku)
          .gt('stock_quantity', 0)
          .single();
          
        if (!stockError && stockData) {
          readyToPick++;
        }
      }
    }
    
    // Get pending items (items with "To Pick" progress but not ready)
    const pendingItems = totalItemsToPick - readyToPick;
    
    // Fetch out of stock items
    let outOfStock = 0;
    
    if (readyItems && readyItems.length > 0) {
      for (const item of readyItems) {
        const { data: stockData, error: stockError } = await supabase
          .from('pinnacle_stock')
          .select('stock_quantity')
          .eq('part_no', item.sku)
          .eq('stock_quantity', 0)
          .single();
          
        if (!stockError && stockData) {
          outOfStock++;
        }
      }
    }
    
    // Get orders processed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todayProcessed, error: todayError } = await supabase
      .from('iron_city_order_progress')
      .select('shopify_order_id')
      .eq('progress', 'Picked')
      .gte('updated_at', today.toISOString());
      
    if (todayError) throw todayError;
    
    const uniqueTodayOrderIds = [...new Set(todayProcessed?.map(item => item.shopify_order_id))];
    const ordersProcessedToday = uniqueTodayOrderIds.length;
    
    // Calculate average pick time (this would require additional tracking data,
    // using a placeholder for now until we have actual timing data)
    const averagePickTime = "14m"; // This would be calculated from actual timing data
    
    return {
      totalOrdersToPick,
      totalItemsToPick,
      averagePickTime,
      readyToPick,
      pendingItems,
      outOfStock,
      ordersProcessedToday
    };
  } catch (error) {
    console.error("Error fetching Pick Stats data:", error);
    throw new Error("Failed to fetch Pick Stats data");
  }
};
