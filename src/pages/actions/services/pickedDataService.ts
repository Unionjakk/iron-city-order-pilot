
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch the total quantity picked for a specific SKU across all orders
 */
export const fetchTotalPickedQuantityForSku = async (sku: string): Promise<number | null> => {
  try {
    const { data, error } = await supabase
      .from('iron_city_order_progress')
      .select('quantity_picked')
      .eq('sku', sku)
      .eq('progress', 'Picked');
    
    if (error) {
      console.error('Error fetching picked quantity:', error);
      return null;
    }
    
    // Sum up the quantity_picked values
    const totalPicked = data.reduce((sum, item) => {
      return sum + (item.quantity_picked || 0);
    }, 0);
    
    return totalPicked;
  } catch (err) {
    console.error('Unexpected error fetching picked quantity:', err);
    return null;
  }
};

/**
 * Fetch all items with "Picked" progress status
 */
export const fetchPickedItemsProgress = async () => {
  try {
    const { data, error } = await supabase
      .from('iron_city_order_progress')
      .select('*')
      .eq('progress', 'Picked');
    
    if (error) {
      console.error('Error fetching picked progress items:', error);
      throw new Error(`Picked progress fetch error: ${error.message}`);
    }
    
    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching picked progress items:', err);
    throw err;
  }
};

/**
 * Fetch orders with picked items
 */
export const fetchOrdersWithPickedItems = async () => {
  try {
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
      .in('id', function(subquery) {
        subquery
          .select('order_id')
          .from('iron_city_order_progress')
          .eq('progress', 'Picked');
      });
    
    if (error) {
      console.error('Error fetching orders with picked items:', error);
      throw new Error(`Orders fetch error: ${error.message}`);
    }
    
    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching orders with picked items:', err);
    throw err;
  }
};

/**
 * Fetch line items for given order IDs
 */
export const fetchLineItemsForOrders = async (orderIds: string[]) => {
  try {
    if (!orderIds.length) return [];
    
    const { data, error } = await supabase
      .from('shopify_order_items')
      .select('*')
      .in('order_id', orderIds);
      
    if (error) {
      console.error('Error fetching line items:', error);
      throw new Error(`Line items fetch error: ${error.message}`);
    }
    
    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching line items:', err);
    throw err;
  }
};

/**
 * Fetch stock information for given SKUs
 */
export const fetchStockForSkus = async (skus: string[]) => {
  try {
    if (!skus.length) return [];
    
    const { data, error } = await supabase
      .from('pinnacle_stock')
      .select('part_no, stock_quantity, bin_location, cost')
      .in('part_no', skus);
      
    if (error) {
      console.error('Error fetching stock information:', error);
      throw new Error(`Stock fetch error: ${error.message}`);
    }
    
    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching stock information:', err);
    throw err;
  }
};
