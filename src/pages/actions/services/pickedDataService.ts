import { supabase } from "@/integrations/supabase/client";
import { UNFULFILLED_STATUS } from "../constants/picklistConstants";

/**
 * Fetch unfulfilled orders from Supabase that have items marked as "Picked"
 */
export const fetchOrdersWithPickedItems = async () => {
  console.log("Fetching orders with 'Picked' items...");
  
  try {
    // Get all unique order IDs directly from the materialized view with a single query
    const { data: orderIds, error: orderIdsError } = await supabase
      .from('picked_items_mv')
      .select('shopify_order_id');
      
    if (orderIdsError) {
      console.error("Error fetching order IDs:", orderIdsError);
      throw new Error(`Error fetching order IDs: ${orderIdsError.message}`);
    }
    
    if (!orderIds || orderIds.length === 0) {
      console.log("No orders have 'Picked' items");
      return [];
    }
    
    // Extract the unique order IDs into an array
    const uniqueIds = [...new Set(orderIds.map(o => o.shopify_order_id))];
    console.log(`Found ${uniqueIds.length} unique orders with picked items`);
    
    // Fetch the unfulfilled orders that match these IDs
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
      .in('shopify_order_id', uniqueIds);
      
    if (error) {
      console.error("Orders fetch error:", error);
      throw new Error(`Orders fetch error: ${error.message}`);
    }
    
    console.log(`Fetched ${data?.length || 0} unfulfilled orders with 'Picked' items`);
    return data || [];
  } catch (error) {
    console.error("Error in fetchOrdersWithPickedItems:", error);
    throw error;
  }
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
 * Fetch progress information specifically for "Picked" items using materialized view
 */
export const fetchPickedItemsProgress = async () => {
  console.log("Fetching 'Picked' items from materialized view...");
  
  try {
    const { data, error } = await supabase
      .from('picked_items_mv')
      .select();
      
    if (error) {
      console.error("Progress fetch error:", error);
      return [];
    }
    
    if (!data) {
      return [];
    }
    
    console.log(`Fetched ${data.length} 'Picked' progress items from materialized view`);
    return data;
  } catch (error) {
    console.error("Error in fetchPickedItemsProgress:", error);
    return [];
  }
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

/**
 * Get total picked quantity for a given SKU across all orders
 */
export const fetchTotalPickedQuantityForSku = async (sku: string): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc('sum_picked_quantity_by_sku', { sku_param: sku });
      
    if (error) {
      console.error("Error fetching total picked quantity:", error);
      throw error;
    }
    
    return data ?? 0;
  } catch (error) {
    console.error("Error fetching total picked quantity:", error);
    return 0;
  }
};

/**
 * Check order statuses (for debugging)
 */
export const checkOrderStatuses = async () => {
  const { data, error } = await supabase
    .from('shopify_orders')
    .select('status')
    .limit(20);
    
  if (error) throw new Error(`Status check error: ${error.message}`);
  return Array.from(new Set(data?.map(s => s.status)));
};
