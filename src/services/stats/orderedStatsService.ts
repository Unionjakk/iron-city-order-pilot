
import { OrderedStatsData } from "@/components/stats/OrderedStats";
import { supabase } from "@/integrations/supabase/client";

// Fetch real data for Ordered Stats from the database
export const fetchOrderedStatsData = async (): Promise<OrderedStatsData> => {
  try {
    console.log("Fetching real Ordered Stats data from database");
    
    // Get total orders to order
    const { data: toOrderData, error: toOrderError } = await supabase
      .from('iron_city_order_progress')
      .select('shopify_order_id')
      .eq('progress', 'To Order');
      
    if (toOrderError) throw toOrderError;
    
    // Get unique order count
    const uniqueOrderIds = [...new Set(toOrderData?.map(item => item.shopify_order_id))];
    const totalOrdersToOrder = uniqueOrderIds.length;
    
    // Get total items to order
    const totalItemsToOrder = toOrderData?.length || 0;
    
    // Get items ready to order count
    // These would be items marked 'To Order' that have approvals
    const readyToOrder = totalItemsToOrder; // Simplified assumption
    
    // Get pending approval count
    // This would need additional status tracking in your database
    const { data: pendingData, error: pendingError } = await supabase
      .from('iron_city_order_progress')
      .select('id')
      .eq('progress', 'To Order')
      .ilike('notes', '%approval%');
      
    if (pendingError) throw pendingError;
    
    const pendingApproval = pendingData?.length || 0;
    
    // Fetch out of stock items
    const { data: outOfStockItems, error: outOfStockError } = await supabase
      .from('iron_city_order_progress')
      .select('id, sku')
      .eq('progress', 'To Order');
      
    if (outOfStockError) throw outOfStockError;
    
    // For each item, check stock quantity
    let outOfStock = 0;
    
    if (outOfStockItems && outOfStockItems.length > 0) {
      for (const item of outOfStockItems) {
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
    
    // Get orders placed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todayOrdered, error: todayError } = await supabase
      .from('iron_city_order_progress')
      .select('shopify_order_id')
      .eq('progress', 'Ordered')
      .gte('updated_at', today.toISOString());
      
    if (todayError) throw todayError;
    
    const uniqueTodayOrderIds = [...new Set(todayOrdered?.map(item => item.shopify_order_id))];
    const ordersPlacedToday = uniqueTodayOrderIds.length;
    
    // Average wait time would require tracking order timestamps
    const averageWaitTime = "3d 4h"; // Placeholder until we have timing data
    
    return {
      totalOrdersToOrder,
      totalItemsToOrder,
      averageWaitTime,
      readyToOrder,
      pendingApproval,
      outOfStock,
      ordersPlacedToday
    };
  } catch (error) {
    console.error("Error fetching Ordered Stats data:", error);
    throw new Error("Failed to fetch Ordered Stats data");
  }
};
