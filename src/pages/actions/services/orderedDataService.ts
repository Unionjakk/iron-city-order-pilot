
import { supabase } from "@/integrations/supabase/client";
import { UNFULFILLED_STATUS } from "../constants/picklistConstants";

/**
 * Fetch unfulfilled orders from Supabase that have items marked as "Ordered"
 */
export const fetchOrdersWithOrderedItems = async () => {
  console.log("Fetching orders with 'Ordered' items...");
  
  // First get the shopify order IDs that have "Ordered" progress
  const { data: progressData, error: progressError } = await supabase
    .from('iron_city_order_progress')
    .select('shopify_order_id, sku')
    .eq('progress', 'Ordered');
    
  if (progressError) {
    console.error("Progress fetch error:", progressError);
    throw new Error(`Progress fetch error: ${progressError.message}`);
  }
  
  // If no orders have "Ordered" items, return empty array
  if (!progressData || progressData.length === 0) {
    console.log("No orders have 'Ordered' items");
    return [];
  }
  
  console.log(`Found ${progressData.length} orders with 'Ordered' progress items:`, progressData);
  
  // Extract the order IDs
  const orderIds = [...new Set(progressData.map(item => item.shopify_order_id))];
  
  // Now fetch just those orders
  const { data, error } = await supabase
    .from('shopify_orders')
    .select(`
      id,
      shopify_order_id,
      shopify_order_number,
      customer_name,
      customer_email,
      created_at,
      status
    `)
    .eq('status', UNFULFILLED_STATUS)
    .in('shopify_order_id', orderIds);
    
  if (error) {
    console.error("Orders fetch error:", error);
    throw new Error(`Orders fetch error: ${error.message}`);
  }
  
  console.log(`Fetched ${data?.length || 0} unfulfilled orders with 'Ordered' items`);
  return data || [];
};

/**
 * Fetch ordered items progress information
 */
export const fetchOrderedItemsProgress = async () => {
  console.log("Fetching 'Ordered' progress items...");
  
  const { data, error } = await supabase
    .from('iron_city_order_progress')
    .select('shopify_order_id, sku, progress, notes, hd_orderlinecombo, status, dealer_po_number')
    .eq('progress', 'Ordered');
    
  if (error) {
    console.error("Progress fetch error:", error);
    throw new Error(`Progress fetch error: ${error.message}`);
  }
  
  console.log(`Fetched ${data?.length || 0} 'Ordered' progress items`);
  return data || [];
};
