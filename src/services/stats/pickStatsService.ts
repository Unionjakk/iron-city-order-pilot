
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
    
    // Convert the returned JSON data to the expected type
    return {
      totalOrdersToPick: data.totalOrdersToPick || 0,
      totalItemsToPick: data.totalItemsToPick || 0,
      averagePickTime: data.averagePickTime || "0m",
      readyToPick: data.readyToPick || 0,
      pendingItems: data.pendingItems || 0,
      outOfStock: data.outOfStock || 0,
      ordersProcessedToday: data.ordersProcessedToday || 0
    };
  } catch (error) {
    console.error("Error fetching Pick Stats data:", error);
    throw new Error("Failed to fetch Pick Stats data");
  }
};
