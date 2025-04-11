
import { OrderedStatsData } from "@/components/stats/OrderedStats";
import { supabase } from "@/integrations/supabase/client";

// Fetch stats data for Ordered Stats from the cached stats table
export const fetchOrderedStatsData = async (): Promise<OrderedStatsData> => {
  try {
    console.log("Fetching Ordered Stats data from cache");
    
    // Get the cached stats from our new function
    const { data, error } = await supabase
      .rpc('get_dashboard_stats', { stats_type_param: 'ordered' });
      
    if (error) throw error;
    
    if (!data) {
      throw new Error("No cached Ordered Stats data available");
    }
    
    // Ensure data is the expected object type
    const statsData = data as Record<string, any>;
    
    // Convert the returned JSON data to the expected type with fallbacks
    return {
      totalOrdersToOrder: typeof statsData.totalOrdersToOrder === 'number' ? statsData.totalOrdersToOrder : 0,
      totalItemsToOrder: typeof statsData.totalItemsToOrder === 'number' ? statsData.totalItemsToOrder : 0,
      averageWaitTime: typeof statsData.averageWaitTime === 'string' ? statsData.averageWaitTime : "0d 0h",
      readyToOrder: typeof statsData.readyToOrder === 'number' ? statsData.readyToOrder : 0,
      pendingApproval: typeof statsData.pendingApproval === 'number' ? statsData.pendingApproval : 0,
      outOfStock: typeof statsData.outOfStock === 'number' ? statsData.outOfStock : 0,
      ordersPlacedToday: typeof statsData.ordersPlacedToday === 'number' ? statsData.ordersPlacedToday : 0
    };
  } catch (error) {
    console.error("Error fetching Ordered Stats data:", error);
    throw new Error("Failed to fetch Ordered Stats data");
  }
};
