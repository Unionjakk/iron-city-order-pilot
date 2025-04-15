import { supabase } from "@/integrations/supabase/client";
import { UNFULFILLED_STATUS } from "../constants/picklistConstants";

/**
 * Fetch unfulfilled orders from Supabase that have items marked as "Picked"
 */
export const fetchOrdersWithPickedItems = async () => {
  console.log("Fetching orders with 'Picked' items...");
  
  try {
    // First get distinct order IDs from the materialized view
    const { data: orderIds, error: orderIdsError } = await supabase
      .from('picked_items_mv')
      .select('shopify_order_id')
      .distinct();
      
    if (orderIdsError) {
      console.error("Error fetching order IDs:", orderIdsError);
      throw new Error(`Error fetching order IDs: ${orderIdsError.message}`);
    }
    
    if (!orderIds || orderIds.length === 0) {
      console.log("No orders have 'Picked' items");
      return [];
    }
    
    // Extract the order IDs into an array
    const ids = orderIds.map(o => o.shopify_order_id);
    
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
      .in('shopify_order_id', ids);
      
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
      .select('*');
      
    if (error) {
      console.error("Progress fetch error:", error);
      return [];
    }
    
    // Transform the data to match the expected format
    const transformedData = data.map(item => ({
      shopify_order_id: item.shopify_order_id,
      sku: item.sku,
      progress: 'Picked',
      notes: item.notes,
      quantity: item.quantity,
      quantity_picked: item.quantity_picked,
      quantity_required: item.quantity_required,
      is_partial: item.is_partial
    }));
    
    console.log(`Fetched ${transformedData.length} 'Picked' progress items from materialized view`);
    return transformedData;
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
    const { data, error } = await supabase
      .from('picked_items_mv')
      .select('quantity_picked')
      .eq('sku', sku);
      
    if (error) throw error;
    
    // Sum up all picked quantities
    const totalPicked = data?.reduce((sum, item) => {
      return sum + (item.quantity_picked || 0);
    }, 0);
    
    return totalPicked || 0;
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
