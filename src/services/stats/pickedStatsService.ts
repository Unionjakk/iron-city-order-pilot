
import { PickedStatsData } from "@/components/stats/PickedStats";
import { supabase } from "@/integrations/supabase/client";

// Fetch stats data for Picked Stats from the cached stats table
export const fetchPickedStatsData = async (): Promise<PickedStatsData> => {
  try {
    console.log("Fetching Picked Stats data from cache");
    
    // Get the cached stats from our new function
    const { data, error } = await supabase
      .rpc('get_dashboard_stats', { stats_type_param: 'picked' });
      
    if (error) throw error;
    
    if (!data) {
      throw new Error("No cached Picked Stats data available");
    }
    
    // Ensure data is the expected object type
    const statsData = data as Record<string, any>;
    
    // Convert the returned JSON data to the expected type with fallbacks
    return {
      totalOrdersPicked: typeof statsData.totalOrdersPicked === 'number' ? statsData.totalOrdersPicked : 0,
      totalItemsPicked: typeof statsData.totalItemsPicked === 'number' ? statsData.totalItemsPicked : 0,
      readyToDispatch: typeof statsData.readyToDispatch === 'number' ? statsData.readyToDispatch : 0,
      avgTimeToDispatch: typeof statsData.avgTimeToDispatch === 'string' ? statsData.avgTimeToDispatch : "0m",
      pickedToday: typeof statsData.pickedToday === 'number' ? statsData.pickedToday : 0,
      awaitingItems: typeof statsData.awaitingItems === 'number' ? statsData.awaitingItems : 0,
      completionRate: typeof statsData.completionRate === 'string' ? statsData.completionRate : "0%"
    };
  } catch (error) {
    console.error("Error fetching Picked Stats data:", error);
    throw new Error("Failed to fetch Picked Stats data");
  }
};
