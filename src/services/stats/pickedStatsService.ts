
import { PickedStatsData } from "@/components/stats/PickedStats";
import { supabase } from "@/integrations/supabase/client";

// Fetch real data for Picked Stats from the database
export const fetchPickedStatsData = async (): Promise<PickedStatsData> => {
  try {
    console.log("Fetching real Picked Stats data from database");
    
    // Get total orders picked
    const { data: pickedData, error: pickedError } = await supabase
      .from('iron_city_order_progress')
      .select('shopify_order_id')
      .eq('progress', 'Picked');
      
    if (pickedError) throw pickedError;
    
    // Get unique order count
    const uniqueOrderIds = [...new Set(pickedData?.map(item => item.shopify_order_id))];
    const totalOrdersPicked = uniqueOrderIds.length;
    
    // Get total items picked
    const totalItemsPicked = pickedData?.length || 0;
    
    // Get ready to dispatch count (these would be picked items ready for shipping)
    // This would need additional status tracking in the database
    const { data: dispatchOrders, error: dispatchError } = await supabase
      .from('shopify_orders')
      .select('id, shopify_order_id')
      .eq('status', 'unfulfilled');
      
    if (dispatchError) throw dispatchError;
    
    // Check which of these orders have all items picked
    let readyToDispatch = 0;
    for (const order of dispatchOrders || []) {
      const { data: orderItems, error: itemsError } = await supabase
        .from('iron_city_order_progress')
        .select('progress')
        .eq('shopify_order_id', order.shopify_order_id);
        
      if (itemsError) continue;
      
      // If all items are picked, the order is ready to dispatch
      const allItemsPicked = orderItems?.every(item => item.progress === 'Picked') || false;
      if (allItemsPicked && orderItems?.length > 0) readyToDispatch++;
    }
    
    // Get picked today count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todayPicked, error: todayError } = await supabase
      .from('iron_city_order_progress')
      .select('shopify_order_id')
      .eq('progress', 'Picked')
      .gte('updated_at', today.toISOString());
      
    if (todayError) throw todayError;
    
    const uniqueTodayOrderIds = [...new Set(todayPicked?.map(item => item.shopify_order_id))];
    const pickedToday = uniqueTodayOrderIds.length;
    
    // Get awaiting items (items that are partly picked but order not complete)
    // This would need additional logic based on your business rules
    const awaitingItems = 4; // Placeholder until we have proper tracking
    
    // Calculate completion rate
    // This could be total picked orders / (total picked + total to pick)
    const { data: allOrders, error: allOrdersError } = await supabase
      .from('shopify_orders')
      .select('count');
      
    if (allOrdersError) throw allOrdersError;
    
    // Parse the count result properly - assuming it returns a string
    const totalOrders = allOrders && allOrders.length > 0 ? 
      (typeof allOrders[0].count === 'string' ? parseInt(allOrders[0].count) : allOrders[0].count) || 0 : 0;
    
    const completionRate = totalOrders > 0 ? Math.round((totalOrdersPicked / totalOrders) * 100) + "%" : "0%";
    
    // Average time to dispatch would require tracking timestamps
    const avgTimeToDispatch = "35m"; // Placeholder until we have timing data
    
    return {
      totalOrdersPicked,
      totalItemsPicked,
      readyToDispatch,
      avgTimeToDispatch,
      pickedToday,
      awaitingItems,
      completionRate
    };
  } catch (error) {
    console.error("Error fetching Picked Stats data:", error);
    throw new Error("Failed to fetch Picked Stats data");
  }
};
