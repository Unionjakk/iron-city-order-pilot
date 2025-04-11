
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
