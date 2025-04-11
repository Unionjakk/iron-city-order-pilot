
import { supabase } from "@/integrations/supabase/client";

// Force a refresh of all cached stats
export const refreshAllStats = async (): Promise<boolean> => {
  try {
    console.log("Manually refreshing all dashboard stats");
    
    // Call the function to update stats
    const { error } = await supabase.rpc('update_dashboard_stats');
    
    if (error) {
      console.error("Error refreshing stats:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error refreshing stats:", error);
    return false;
  }
};
