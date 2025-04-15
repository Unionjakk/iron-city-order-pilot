
import { supabase } from "@/integrations/supabase/client";
import { UNFULFILLED_STATUS } from "../constants/picklistConstants";

/**
 * Fetch unfulfilled orders from Supabase that have items marked as "Picked"
 */
export const fetchOrdersWithPickedItems = async () => {
  console.log("Fetching orders with 'Picked' items...");
  
  try {
    // Since the materialized view has been deleted, we now directly query from the iron_city_order_progress table
    const { data: pickedItems, error: pickedItemsError } = await supabase
      .from('iron_city_order_progress')
      .select('shopify_order_id')
      .eq('progress', 'Picked');
      
    if (pickedItemsError) {
      console.error("Error fetching picked items:", pickedItemsError);
      throw new Error(`Error fetching picked items: ${pickedItemsError.message}`);
    }
    
    if (!pickedItems || pickedItems.length === 0) {
      console.log("No items have been marked as 'Picked'");
      return [];
    }
    
    // Extract the unique order IDs into an array
    const uniqueIds = [...new Set(pickedItems.map(o => o.shopify_order_id))];
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
 * Fetch progress information specifically for "Picked" items directly from iron_city_order_progress
 * This replaces the previous function that used the materialized view
 */
export const fetchPickedItemsProgress = async () => {
  console.log("Fetching 'Picked' items from iron_city_order_progress...");
  
  try {
    const { data, error } = await supabase
      .from('iron_city_order_progress')
      .select()
      .eq('progress', 'Picked');
      
    if (error) {
      console.error("Progress fetch error:", error);
      return [];
    }
    
    if (!data) {
      return [];
    }
    
    console.log(`Fetched ${data.length} 'Picked' progress items from iron_city_order_progress`);
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
 * This replaces the previous function that used the sum_picked_quantity_by_sku RPC
 */
export const fetchTotalPickedQuantityForSku = async (sku: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('iron_city_order_progress')
      .select('quantity_picked')
      .eq('sku', sku)
      .eq('progress', 'Picked');
      
    if (error) {
      console.error("Error fetching total picked quantity:", error);
      throw error;
    }
    
    // Sum up the quantity_picked values
    const total = data?.reduce((sum, item) => sum + (item.quantity_picked || 0), 0) || 0;
    return total;
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
