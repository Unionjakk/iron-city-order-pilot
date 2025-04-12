
import { supabase } from "@/integrations/supabase/client";
import { DragAndDropOrderItem } from "../types/dragAndDropTypes";
import { LEEDS_LOCATION_ID } from "../../actions/constants/picklistConstants";

export interface DragAndDropData {
  orderItems: DragAndDropOrderItem[];
  lastRefreshTime: string | null;
}

/**
 * Fetches the data needed for the drag and drop board
 */
export const fetchDragAndDropData = async (): Promise<DragAndDropData> => {
  console.log("Fetching order items data for drag and drop board");
  
  // Step 1: Get the last refresh time from settings
  const { data: settingsData } = await supabase
    .from('shopify_settings')
    .select('setting_value')
    .eq('setting_name', 'last_sync_time')
    .single();
  
  const lastRefreshTime = settingsData?.setting_value || null;
  
  // Step 2: Get all unfulfilled orders
  const { data: ordersData, error: ordersError } = await supabase
    .from('shopify_orders')
    .select(`
      id,
      shopify_order_id,
      shopify_order_number,
      customer_name,
      created_at,
      status
    `)
    .eq('status', 'unfulfilled');
  
  if (ordersError) {
    throw new Error(`Orders fetch error: ${ordersError.message}`);
  }
  
  if (!ordersData || ordersData.length === 0) {
    console.log("No unfulfilled orders found");
    return { orderItems: [], lastRefreshTime };
  }
  
  console.log(`Found ${ordersData.length} unfulfilled orders`);
  
  // Step 3: Get all line items for these orders
  const orderIds = ordersData.map(order => order.id);
  
  const { data: allLineItemsData, error: lineItemsError } = await supabase
    .from('shopify_order_items')
    .select('*')
    .in('order_id', orderIds);
  
  if (lineItemsError) {
    throw new Error(`Line items fetch error: ${lineItemsError.message}`);
  }
  
  // Filter for Leeds location only
  const lineItemsData = allLineItemsData?.filter(item => item.location_id === LEEDS_LOCATION_ID) || [];
  
  if (lineItemsData.length === 0) {
    console.log("No line items found for Leeds location");
    return { orderItems: [], lastRefreshTime };
  }
  
  // Step 4: Get stock information
  const skus = [...new Set(lineItemsData.map(item => item.sku).filter(Boolean))];
  
  const { data: stockData, error: stockError } = await supabase
    .from('pinnacle_stock')
    .select('part_no, stock_quantity, bin_location, cost')
    .in('part_no', skus);
  
  if (stockError) {
    throw new Error(`Stock fetch error: ${stockError.message}`);
  }
  
  // Step 5: Get ALL progress data for these orders (not filtered by status)
  const { data: progressData, error: progressError } = await supabase
    .from('iron_city_order_progress')
    .select('shopify_order_id, sku, progress, notes, quantity, quantity_required, quantity_picked, is_partial, hd_orderlinecombo, status, dealer_po_number')
    .in('shopify_order_id', ordersData.map(o => o.shopify_order_id));
  
  if (progressError) {
    throw new Error(`Progress fetch error: ${progressError.message}`);
  }
  
  const processedItems = processDragAndDropData(ordersData, lineItemsData, stockData || [], progressData || []);
  
  return {
    orderItems: processedItems,
    lastRefreshTime
  };
};

/**
 * Processes raw data into DragAndDropOrderItem objects
 */
export const processDragAndDropData = (
  ordersData: any[],
  lineItemsData: any[],
  stockData: any[],
  progressData: any[]
): DragAndDropOrderItem[] => {
  // Create a lookup map for stock data
  const stockMap = new Map();
  stockData.forEach(item => {
    stockMap.set(item.part_no, item);
  });
  
  // Create a lookup map for progress data
  const progressByOrderAndSku = new Map<string, any>();
  progressData.forEach(item => {
    const key = `${item.shopify_order_id}_${item.sku}`;
    progressByOrderAndSku.set(key, item);
  });
  
  // Process the data
  const processedItems: DragAndDropOrderItem[] = [];
  
  lineItemsData.forEach(item => {
    // Get the corresponding order
    const order = ordersData.find(o => o.id === item.order_id);
    if (!order) return;
    
    // Get stock data
    const stock = stockMap.get(item.sku);
    
    // Get progress data
    const progressKey = `${order.shopify_order_id}_${item.sku}`;
    const progressItem = progressByOrderAndSku.get(progressKey);
    
    // Default progress values
    let progress = progressItem?.progress || "To Pick";
    let notes = progressItem?.notes || null;
    let quantity_required = progressItem?.quantity_required || item.quantity;
    let quantity_picked = progressItem?.quantity_picked || 0;
    let is_partial = progressItem?.is_partial || false;
    let hd_orderlinecombo = progressItem?.hd_orderlinecombo || null;
    let status = progressItem?.status || null;
    let dealer_po_number = progressItem?.dealer_po_number || null;
    
    // Create processed item
    processedItems.push({
      id: item.id,
      orderId: order.id,
      shopifyOrderId: order.shopify_order_id,
      orderNumber: order.shopify_order_number,
      customerName: order.customer_name,
      createdAt: order.created_at,
      sku: item.sku,
      lineItemId: item.shopify_line_item_id,
      title: item.title,
      quantity: item.quantity,
      price: item.price,
      // Stock data
      inStock: !!stock,
      stockQuantity: stock?.stock_quantity || null,
      binLocation: stock?.bin_location || null,
      cost: stock?.cost || null,
      // Progress data
      progress,
      notes,
      hd_orderlinecombo,
      status,
      dealer_po_number,
      // Quantity tracking
      quantityRequired: quantity_required,
      quantityPicked: quantity_picked,
      isPartial: is_partial
    });
  });
  
  console.log(`Processed ${processedItems.length} line items for drag and drop board`);
  return processedItems;
};
