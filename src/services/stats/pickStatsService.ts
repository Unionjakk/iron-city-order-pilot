
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
    
    // Get all unfulfilled orders that don't have progress entries
    // This matches the logic in usePicklistData that powers the picklist page
    const { data: picklistData, error: picklistError } = await supabase
      .rpc('get_picklist_stats');
      
    if (picklistError) throw picklistError;
    
    // Log the raw data to debug what's being returned
    console.log("Raw accurate Pick Stats data:", picklistData);
    
    if (!picklistData) {
      return {
        totalOrdersToPick: 0,
        totalItemsToPick: 0,
        averagePickTime: "0m",
        readyToPick: 0,
        pendingItems: 0,
        outOfStock: 0,
        ordersProcessedToday: 0
      };
    }
    
    // The data is returned as a Record with the stats we need
    const statsData = picklistData as Record<string, any>;
    
    // Get the count of orders processed today
    const { data: processedToday, error: processedError } = await supabase
      .from('iron_city_order_progress')
      .select('shopify_order_id')
      .eq('progress', 'Picked')
      .gte('updated_at', new Date().toISOString().split('T')[0]) // Today's date
      .limit(1000);
      
    if (processedError) throw processedError;
    
    // Get unique order IDs processed today
    const uniqueOrdersProcessed = processedToday ? 
      [...new Set(processedToday.map(item => item.shopify_order_id))].length : 0;
    
    return {
      totalOrdersToPick: typeof statsData.totalOrdersToPick === 'number' ? statsData.totalOrdersToPick : 0,
      totalItemsToPick: typeof statsData.totalItemsToPick === 'number' ? statsData.totalItemsToPick : 0,
      averagePickTime: "14m", // Hardcoded for now, can be calculated from historical data later
      readyToPick: typeof statsData.readyToPick === 'number' ? statsData.readyToPick : 0,
      pendingItems: typeof statsData.pendingItems === 'number' ? statsData.pendingItems : 0,
      outOfStock: typeof statsData.outOfStock === 'number' ? statsData.outOfStock : 0,
      ordersProcessedToday: uniqueOrdersProcessed
    };
  } catch (error) {
    console.error("Error fetching accurate Pick Stats data:", error);
    throw new Error("Failed to fetch accurate Pick Stats data");
  }
};
