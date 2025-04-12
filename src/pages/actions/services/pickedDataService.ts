
import { supabase } from "@/integrations/supabase/client";
import { UNFULFILLED_STATUS } from "../constants/picklistConstants";

/**
 * Fetch unfulfilled orders from Supabase that have items marked as "Picked"
 */
export const fetchOrdersWithPickedItems = async () => {
  console.log("Fetching orders with 'Picked' items...");
  
  try {
    // First get the shopify order IDs that have "Picked" progress
    let progressData;
    
    try {
      // Try to query with the is_partial field
      const { data, error } = await supabase
        .from('iron_city_order_progress')
        .select('shopify_order_id, sku, quantity, is_partial')
        .eq('progress', 'Picked');
        
      if (error) {
        if (error.message && error.message.includes("column 'is_partial' does not exist")) {
          // Handle missing column by querying without it
          const fallbackResult = await supabase
            .from('iron_city_order_progress')
            .select('shopify_order_id, sku, quantity')
            .eq('progress', 'Picked');
            
          if (fallbackResult.error) {
            console.error("Progress fetch error (fallback):", fallbackResult.error);
            throw new Error(`Progress fetch error: ${fallbackResult.error.message}`);
          }
          
          progressData = fallbackResult.data;
        } else {
          console.error("Progress fetch error:", error);
          throw new Error(`Progress fetch error: ${error.message}`);
        }
      } else {
        progressData = data;
      }
    } catch (queryError) {
      console.error("Query error:", queryError);
      throw queryError;
    }
    
    // If no orders have "Picked" items, return empty array
    if (!progressData || progressData.length === 0) {
      console.log("No orders have 'Picked' items");
      return [];
    }
    
    console.log(`Found ${progressData.length} orders with 'Picked' progress items:`, progressData);
    
    // Extract the order IDs - fix TypeScript error by ensuring we only take strings
    // and explicitly mapping to string[] type to avoid the 'unknown[]' error
    const orderIds: string[] = Array.from(
      new Set(
        progressData.map(item => 
          typeof item.shopify_order_id === 'string' ? item.shopify_order_id : String(item.shopify_order_id)
        )
      )
    );
    
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
 * Fetch progress information specifically for "Picked" items
 */
export const fetchPickedItemsProgress = async () => {
  console.log("Fetching 'Picked' progress items...");
  
  try {
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
    
    // Check if the is_partial column exists by trying to select it
    try {
      const { data: columnCheckData } = await supabase
        .from('iron_city_order_progress')
        .select('is_partial')
        .limit(1);
      
      // If the column exists, we can safely include it in our query
      const { data, error: queryError } = await supabase
        .from('iron_city_order_progress')
        .select('shopify_order_id, sku, progress, notes, quantity, hd_orderlinecombo, status, dealer_po_number, quantity_picked, quantity_required, is_partial')
        .eq('progress', 'Picked');
        
      if (queryError) {
        console.error("Progress fetch error:", queryError);
        return [];
      }
      
      console.log(`Fetched ${data?.length || 0} 'Picked' progress items with is_partial field:`, data);
      return data || [];
    } catch (columnError) {
      // The column doesn't exist, so use a select without that column
      console.log("The is_partial column does not exist yet, using query without it");
      const { data, error: fallbackError } = await supabase
        .from('iron_city_order_progress')
        .select('shopify_order_id, sku, progress, notes, quantity, hd_orderlinecombo, status, dealer_po_number, quantity_picked, quantity_required')
        .eq('progress', 'Picked');
        
      if (fallbackError) {
        console.error("Progress fetch error:", fallbackError);
        return [];
      }
      
      console.log(`Fetched ${data?.length || 0} 'Picked' progress items without is_partial field`);
      return data || [];
    }
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
      .from('iron_city_order_progress')
      .select('quantity_picked')
      .eq('sku', sku)
      .eq('progress', 'Picked');
      
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
