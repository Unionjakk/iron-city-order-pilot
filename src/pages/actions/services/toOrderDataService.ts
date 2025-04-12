
import { supabase } from "@/integrations/supabase/client";
import { UNFULFILLED_STATUS } from "../constants/picklistConstants";

/**
 * Fetch unfulfilled orders from Supabase that have items marked as "To Order"
 */
export const fetchOrdersWithToOrderItems = async () => {
  console.log("Fetching orders with 'To Order' items...");
  
  // First get the shopify order IDs that have "To Order" progress
  const { data: progressData, error: progressError } = await supabase
    .from('iron_city_order_progress')
    .select('shopify_order_id, sku')
    .eq('progress', 'To Order');
    
  if (progressError) {
    console.error("Progress fetch error:", progressError);
    throw new Error(`Progress fetch error: ${progressError.message}`);
  }
  
  // If no orders have "To Order" items, return empty array
  if (!progressData || progressData.length === 0) {
    console.log("No orders have 'To Order' items");
    return [];
  }
  
  console.log(`Found ${progressData.length} orders with 'To Order' progress items:`, progressData);
  
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
  
  console.log(`Fetched ${data?.length || 0} unfulfilled orders with 'To Order' items`);
  return data || [];
};

/**
 * Fetch line items for given order IDs
 */
export const fetchLineItemsForOrders = async (orderIds: string[]) => {
  console.log(`Fetching line items for ${orderIds.length} orders:`, orderIds);
  
  if (orderIds.length === 0) {
    console.log("No order IDs provided, skipping line items fetch");
    return [];
  }
  
  const { data, error } = await supabase
    .from('shopify_order_items')
    .select('*')
    .in('order_id', orderIds);
    
  if (error) {
    console.error("Line items fetch error:", error);
    throw new Error(`Line items fetch error: ${error.message}`);
  }
  
  console.log(`Fetched ${data?.length || 0} line items for the orders`);
  return data || [];
};

/**
 * Fetch progress information specifically for "To Order" items
 */
export const fetchToOrderItemsProgress = async () => {
  console.log("Fetching 'To Order' progress items...");
  
  // Debug query to see all progress values
  const { data: allProgress, error: allProgressError } = await supabase
    .from('iron_city_order_progress')
    .select('progress')
    .limit(10);
    
  if (allProgressError) {
    console.error("Progress fetch error:", allProgressError);
  } else {
    // Log unique progress values to debug case issues
    const uniqueProgresses = [...new Set(allProgress.map(p => p.progress))];
    console.log("Debug - Available progress values:", uniqueProgresses);
  }
  
  const { data, error } = await supabase
    .from('iron_city_order_progress')
    .select('shopify_order_id, sku, progress, notes')
    .eq('progress', 'To Order');
    
  if (error) {
    console.error("Progress fetch error:", error);
    throw new Error(`Progress fetch error: ${error.message}`);
  }
  
  console.log(`Fetched ${data?.length || 0} 'To Order' progress items`);
  return data || [];
};

/**
 * Fetch stock information for given SKUs
 */
export const fetchStockForSkus = async (skus: string[]) => {
  if (!skus.length) {
    console.log("No SKUs provided, skipping stock fetch");
    return [];
  }
  
  console.log(`Fetching stock for ${skus.length} SKUs`);
  
  const { data, error } = await supabase
    .from('pinnacle_stock')
    .select('part_no, stock_quantity, bin_location, cost')
    .in('part_no', skus);
    
  if (error) {
    console.error("Stock fetch error:", error);
    throw new Error(`Stock fetch error: ${error.message}`);
  }
  
  console.log(`Fetched stock data for ${data?.length || 0} SKUs`);
  return data || [];
};
