
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch all orders with at least one item marked as "To Order"
 */
export const fetchOrdersWithToOrderItems = async () => {
  console.log("Fetching orders with 'To Order' items...");
  
  // First get the distinct shopify_line_item_id values from order progress where progress is 'To Order'
  const { data: progressData, error: progressError } = await supabase
    .from('iron_city_order_progress')
    .select('shopify_line_item_id')
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
  
  // Extract unique shopify_line_item_id values
  const uniqueOrderIds = [...new Set(progressData.map(item => item.shopify_line_item_id))];
  console.log(`Found ${uniqueOrderIds.length} unique orders with 'To Order' items`);
  
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
    console.error("Orders fetch error:", ordersError);
    throw new Error(`Orders fetch error: ${ordersError.message}`);
  }
  
  console.log(`Fetched ${ordersData?.length || 0} orders with 'To Order' items`);
  return ordersData || [];
};

/**
 * Fetch the "To Order" items for a specific order
 */
export const fetchToOrderItemsForOrder = async (shopifyOrderId: string) => {
  console.log(`Fetching 'To Order' items for order ${shopifyOrderId}...`);
  
  // Get all to order items for this order - Updated to use shopify_line_item_id
  const { data: progressData, error: progressError } = await supabase
    .from('iron_city_order_progress')
    .select('*')
    .eq('shopify_line_item_id', shopifyOrderId);
    
  if (progressError) {
    console.error("Progress fetch error:", progressError);
    throw new Error(`Progress fetch error: ${progressError.message}`);
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
    console.error("Stock fetch error:", stockError);
    throw new Error(`Stock fetch error: ${stockError.message}`);
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
    console.error("Order fetch error:", orderError);
    throw new Error(`Order fetch error: ${orderError.message}`);
  }
  
  // Fetch line items for this order
  const { data: lineItemsData, error: lineItemsError } = await supabase
    .from('shopify_order_items')
    .select('*')
    .eq('order_id', orderData.id);
    
  if (lineItemsError) {
    console.error("Line items fetch error:", lineItemsError);
    throw new Error(`Line items fetch error: ${lineItemsError.message}`);
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

/**
 * Update an item from "To Order" to "Ordered"
 */
export const markItemAsOrdered = async (shopifyOrderId: string, sku: string, po: string, notes: string) => {
  console.log(`Marking item as ordered: ${shopifyOrderId}, ${sku}, PO: ${po}`);
  
  // Format notes with PO number if provided
  const formattedNotes = po ? `PO: ${po}${notes ? ' | ' + notes : ''}` : notes;
  
  // Update the progress status to "Ordered" - Updated to use shopify_line_item_id
  const { data, error } = await supabase
    .from('iron_city_order_progress')
    .update({
      progress: 'Ordered',
      notes: formattedNotes,
      dealer_po_number: po
    })
    .eq('shopify_line_item_id', shopifyOrderId)
    .eq('sku', sku);
    
  if (error) {
    console.error("Error marking item as ordered:", error);
    throw new Error(`Error marking item as ordered: ${error.message}`);
  }
  
  return data;
};
