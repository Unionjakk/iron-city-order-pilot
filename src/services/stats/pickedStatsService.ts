
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
    
    // Convert the returned JSON data to the expected type
    return {
      totalOrdersPicked: data.totalOrdersPicked || 0,
      totalItemsPicked: data.totalItemsPicked || 0,
      readyToDispatch: data.readyToDispatch || 0,
      avgTimeToDispatch: data.avgTimeToDispatch || "0m",
      pickedToday: data.pickedToday || 0,
      awaitingItems: data.awaitingItems || 0,
      completionRate: data.completionRate || "0%"
    };
  } catch (error) {
    console.error("Error fetching Picked Stats data:", error);
    throw new Error("Failed to fetch Picked Stats data");
  }
};
