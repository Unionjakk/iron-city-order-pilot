
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
    
    // Convert the returned JSON data to the expected type
    return {
      totalOrdersToOrder: data.totalOrdersToOrder || 0,
      totalItemsToOrder: data.totalItemsToOrder || 0,
      averageWaitTime: data.averageWaitTime || "0d 0h",
      readyToOrder: data.readyToOrder || 0,
      pendingApproval: data.pendingApproval || 0,
      outOfStock: data.outOfStock || 0,
      ordersPlacedToday: data.ordersPlacedToday || 0
    };
  } catch (error) {
    console.error("Error fetching Ordered Stats data:", error);
    throw new Error("Failed to fetch Ordered Stats data");
  }
};
