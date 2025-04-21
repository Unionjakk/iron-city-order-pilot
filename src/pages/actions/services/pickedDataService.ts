
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch all orders with at least one item marked as "Picked"
 */
export const fetchOrdersWithPickedItems = async () => {
  console.log("Fetching orders with 'Picked' items...");
  
  // Get distinct shopify_line_item_id values from order progress where progress is 'Picked'
  const { data: progressData, error: progressError } = await supabase
    .from('iron_city_order_progress')
    .select('shopify_line_item_id')
    .eq('progress', 'Picked')
    .order('shopify_line_item_id');
    
  if (progressError) {
    console.error("Error fetching progress data:", progressError);
    throw progressError;
  }
  
  // If no orders have "Picked" items, return empty array
  if (!progressData || progressData.length === 0) {
    console.log("No orders have 'Picked' items");
    return [];
  }
  
  // Extract unique shopify_line_item_id values (using as order IDs)
  const uniqueOrderIds = [...new Set(progressData.map(item => item.shopify_line_item_id))];
  console.log(`Found ${uniqueOrderIds.length} unique orders with 'Picked' items`);
  
  // Fetch the order details from shopify_orders
  const { data: ordersData, error: ordersError } = await supabase
    .from('shopify_orders')
    .select(`
      id,
      shopify_order_id,
      shopify_order_number,
      customer_name,
      customer_email,
      created_at
    `)
    .in('shopify_order_id', uniqueOrderIds);
    
  if (ordersError) {
    console.error("Error fetching orders data:", ordersError);
    throw ordersError;
  }
  
  console.log(`Fetched ${ordersData?.length || 0} orders with 'Picked' items`);
  return ordersData || [];
};

/**
 * Fetch the total number of items with "Picked" status for a specific SKU
 */
export const fetchTotalPickedQuantityForSku = async (sku: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('iron_city_order_progress')
      .select('quantity_picked')
      .eq('sku', sku)
      .eq('progress', 'Picked');
      
    if (error) throw error;
    
    if (!data || data.length === 0) return 0;
    
    return data.reduce((sum, item) => sum + (item.quantity_picked || 0), 0);
  } catch (error) {
    console.error("Error fetching picked quantity for sku:", sku, error);
    return 0;
  }
};

/**
 * Fetch all items with progress status "Picked"
 */
export const fetchPickedItemsProgress = async () => {
  console.log("Fetching 'Picked' progress items...");
  
  const { data, error } = await supabase
    .from('iron_city_order_progress')
    .select('shopify_line_item_id, sku, progress, notes, hd_orderlinecombo, status, dealer_po_number, quantity_picked, is_partial')
    .eq('progress', 'Picked');
    
  if (error) {
    console.error("Progress fetch error:", error);
    throw new Error(`Progress fetch error: ${error.message}`);
  }
  
  console.log(`Fetched ${data?.length || 0} 'Picked' progress items`);
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
 * Return items for a specific order marked as "Picked"
 */
export const fetchPickedItemsForOrder = async (shopifyOrderId: string) => {
  console.log(`Fetching 'Picked' items for order ${shopifyOrderId}...`);
  
  // Get all picked items for this order - Updated to use shopify_line_item_id instead of shopify_order_id
  const { data: progressData, error: progressError } = await supabase
    .from('iron_city_order_progress')
    .select('*')
    .eq('shopify_line_item_id', shopifyOrderId);
    
  if (progressError) {
    console.error("Error fetching progress data:", progressError);
    throw progressError;
  }
  
  // If no items found, return empty array
  if (!progressData || progressData.length === 0) {
    console.log(`No items found for order ${shopifyOrderId}`);
    return [];
  }
  
  console.log(`Found ${progressData.length} progress items for order ${shopifyOrderId}`);
  
  // Get all distinct SKUs from the progress data
  const skus = [...new Set(progressData.map(item => item.sku))];
  
  // Fetch stock information for these SKUs
  const { data: stockData, error: stockError } = await supabase
    .from('pinnacle_stock')
    .select('part_no, stock_quantity, bin_location, cost')
    .in('part_no', skus);
    
  if (stockError) {
    console.error("Error fetching stock data:", stockError);
    throw stockError;
  }
  
  // Fetch order details to get the line items
  const { data: orderData, error: orderError } = await supabase
    .from('shopify_orders')
    .select(`
      id,
      shopify_order_id
    `)
    .eq('shopify_order_id', shopifyOrderId)
    .single();
    
  if (orderError) {
    console.error("Error fetching order data:", orderError);
    throw orderError;
  }
  
  // Fetch line items for this order
  const { data: lineItemsData, error: lineItemsError } = await supabase
    .from('shopify_order_items')
    .select('*')
    .eq('order_id', orderData.id);
    
  if (lineItemsError) {
    console.error("Error fetching line items:", lineItemsError);
    throw lineItemsError;
  }
  
  // Create a map of SKU to stock data
  const stockMap = new Map();
  stockData?.forEach(stock => {
    stockMap.set(stock.part_no, stock);
  });
  
  // Create a map of SKU to line item
  const lineItemMap = new Map();
  lineItemsData?.forEach(lineItem => {
    lineItemMap.set(lineItem.sku, lineItem);
  });
  
  // Combine the data
  const combinedData = progressData.map(progress => {
    const stock = stockMap.get(progress.sku);
    const lineItem = lineItemMap.get(progress.sku);
    
    return {
      ...progress,
      ...lineItem,
      in_stock: !!stock,
      stock_quantity: stock?.stock_quantity || null,
      bin_location: stock?.bin_location || null,
      cost: stock?.cost || null
    };
  });
  
  console.log(`Combined data for ${combinedData.length} items`);
  return combinedData;
};
