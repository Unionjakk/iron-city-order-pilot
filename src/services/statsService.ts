
import { PickStatsData } from "@/components/stats/PickStats";
import { PickedStatsData } from "@/components/stats/PickedStats";
import { OrderedStatsData } from "@/components/stats/OrderedStats";
import { supabase } from "@/integrations/supabase/client";

// Fetch real data for Pick Stats from the database
export const fetchPickStatsData = async (): Promise<PickStatsData> => {
  try {
    console.log("Fetching real Pick Stats data from database");
    
    // Get total orders to pick (orders with items that have "To Pick" progress)
    const { data: toPickData, error: toPickError } = await supabase
      .from('iron_city_order_progress')
      .select('shopify_order_id')
      .eq('progress', 'To Pick');
      
    if (toPickError) throw toPickError;
    
    // Get unique order count
    const uniqueOrderIds = [...new Set(toPickData?.map(item => item.shopify_order_id))];
    const totalOrdersToPick = uniqueOrderIds.length;
    
    // Get total items to pick
    const totalItemsToPick = toPickData?.length || 0;
    
    // Get ready to pick count (these are items with "Ready" status in stock)
    const { data: readyItems, error: readyError } = await supabase
      .from('iron_city_order_progress')
      .select('id, sku')
      .eq('progress', 'To Pick');
      
    if (readyError) throw readyError;
    
    // For each item, check stock quantity
    let readyToPick = 0;
    
    if (readyItems && readyItems.length > 0) {
      for (const item of readyItems) {
        const { data: stockData, error: stockError } = await supabase
          .from('pinnacle_stock')
          .select('stock_quantity')
          .eq('part_no', item.sku)
          .gt('stock_quantity', 0)
          .single();
          
        if (!stockError && stockData) {
          readyToPick++;
        }
      }
    }
    
    // Get pending items (items with "To Pick" progress but not ready)
    const pendingItems = totalItemsToPick - readyToPick;
    
    // Fetch out of stock items
    let outOfStock = 0;
    
    if (readyItems && readyItems.length > 0) {
      for (const item of readyItems) {
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
    
    // Get orders processed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todayProcessed, error: todayError } = await supabase
      .from('iron_city_order_progress')
      .select('shopify_order_id')
      .eq('progress', 'Picked')
      .gte('updated_at', today.toISOString());
      
    if (todayError) throw todayError;
    
    const uniqueTodayOrderIds = [...new Set(todayProcessed?.map(item => item.shopify_order_id))];
    const ordersProcessedToday = uniqueTodayOrderIds.length;
    
    // Calculate average pick time (this would require additional tracking data,
    // using a placeholder for now until we have actual timing data)
    const averagePickTime = "14m"; // This would be calculated from actual timing data
    
    return {
      totalOrdersToPick,
      totalItemsToPick,
      averagePickTime,
      readyToPick,
      pendingItems,
      outOfStock,
      ordersProcessedToday
    };
  } catch (error) {
    console.error("Error fetching Pick Stats data:", error);
    throw new Error("Failed to fetch Pick Stats data");
  }
};

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
