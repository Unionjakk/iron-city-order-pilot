
import { supabase } from "@/integrations/supabase/client";
import { UNFULFILLED_STATUS } from "../constants/picklistConstants";

/**
 * Fetch unfulfilled orders from Supabase that have items marked as "To Dispatch"
 */
export const fetchOrdersWithToDispatchItems = async () => {
  console.log("Fetching orders with 'To Dispatch' items...");
  
  // First get the shopify order IDs that have "To Dispatch" progress
  const { data: progressData, error: progressError } = await supabase
    .from('iron_city_order_progress')
    .select('shopify_order_id, sku, quantity')
    .eq('progress', 'To Dispatch');
    
  if (progressError) {
    console.error("Progress fetch error:", progressError);
    throw new Error(`Progress fetch error: ${progressError.message}`);
  }
  
  // If no orders have "To Dispatch" items, return empty array
  if (!progressData || progressData.length === 0) {
    console.log("No orders have 'To Dispatch' items");
    return [];
  }
  
  console.log(`Found ${progressData.length} orders with 'To Dispatch' progress items:`, progressData);
  
  // Extract the order IDs
  const orderIds = [...new Set(progressData.map(item => item.shopify_order_id))];
  
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
  
  console.log(`Fetched ${data?.length || 0} unfulfilled orders with 'To Dispatch' items`);
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
 * Fetch progress information specifically for "To Dispatch" items
 */
export const fetchToDispatchItemsProgress = async () => {
  console.log("Fetching 'To Dispatch' progress items...");
  
  const { data, error } = await supabase
    .from('iron_city_order_progress')
    .select('shopify_order_id, sku, progress, notes, quantity, hd_orderlinecombo, status, dealer_po_number')
    .eq('progress', 'To Dispatch');
    
  if (error) {
    console.error("Progress fetch error:", error);
    throw new Error(`Progress fetch error: ${error.message}`);
  }
  
  console.log(`Fetched ${data?.length || 0} 'To Dispatch' progress items:`, data);
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

/**
 * Mark a dispatch item as fulfilled
 */
export const markDispatchItemAsFulfilled = async (shopifyOrderId: string, sku: string, notes?: string) => {
  const currentDate = new Date().toISOString().slice(0, 10);
  const noteAddition = `Marked as fulfilled: ${currentDate}`;
  const updatedNotes = notes ? `${notes} | ${noteAddition}` : noteAddition;
  
  const { data, error } = await supabase
    .from('iron_city_order_progress')
    .update({
      progress: "Fulfilled",
      notes: updatedNotes
    })
    .eq('shopify_order_id', shopifyOrderId)
    .eq('sku', sku);
    
  if (error) {
    throw error;
  }
  
  return data;
};
