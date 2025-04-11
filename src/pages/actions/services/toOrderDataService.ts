
import { supabase } from "@/integrations/supabase/client";
import { UNFULFILLED_STATUS } from "../constants/picklistConstants";

/**
 * Fetch unfulfilled orders from Supabase that have items marked as "To Order"
 */
export const fetchOrdersWithToOrderItems = async () => {
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
    .eq('status', UNFULFILLED_STATUS);
    
  if (error) throw new Error(`Orders fetch error: ${error.message}`);
  return data || [];
};

/**
 * Fetch line items for given order IDs
 */
export const fetchLineItemsForOrders = async (orderIds: string[]) => {
  const { data, error } = await supabase
    .from('shopify_order_items')
    .select('*')
    .in('order_id', orderIds);
    
  if (error) throw new Error(`Line items fetch error: ${error.message}`);
  return data || [];
};

/**
 * Fetch progress information for order line items that are marked as "To Order"
 */
export const fetchToOrderItemsProgress = async () => {
  const { data, error } = await supabase
    .from('iron_city_order_progress')
    .select('shopify_order_id, sku, progress, notes')
    .eq('progress', 'To Order');
    
  if (error) throw new Error(`Progress fetch error: ${error.message}`);
  return data || [];
};

/**
 * Fetch stock information for given SKUs
 */
export const fetchStockForSkus = async (skus: string[]) => {
  const { data, error } = await supabase
    .from('pinnacle_stock')
    .select('part_no, stock_quantity, bin_location, cost')
    .in('part_no', skus);
    
  if (error) throw new Error(`Stock fetch error: ${error.message}`);
  return data || [];
};
