
import { supabase } from '@/integrations/supabase/client';
import { ShopifyOrder } from '@/components/shopify/OrdersTable';

/**
 * Retrieves the last sync time from Supabase
 */
export const getLastSyncTime = async (): Promise<string | null> => {
  const { data: lastSyncData, error: syncError } = await supabase.rpc("get_shopify_setting", { 
    setting_name_param: 'last_sync_time' 
  });
  
  if (syncError) {
    console.error('Error checking for last sync time:', syncError);
    throw new Error(`Error retrieving sync status: ${syncError.message}`);
  }
  
  if (lastSyncData && typeof lastSyncData === 'string') {
    console.log(`Last sync time: ${lastSyncData}`);
    return lastSyncData;
  }
  
  return null;
};

/**
 * Checks if auto-import is enabled
 */
export const getAutoImportStatus = async (): Promise<boolean> => {
  const { data: autoImportData, error: autoImportError } = await supabase.rpc("get_shopify_setting", { 
    setting_name_param: 'auto_import_enabled' 
  });
  
  if (autoImportError) {
    console.error('Error checking auto-import setting:', autoImportError);
    throw new Error(`Error checking auto-import setting: ${autoImportError.message}`);
  }
  
  const isEnabled = autoImportData === 'true';
  console.log(`Auto import enabled: ${isEnabled}`);
  return isEnabled;
};

/**
 * Tests the API connection by retrieving token and endpoint
 */
export const testApiConnection = async (): Promise<void> => {
  try {
    const tokenPromise = supabase.rpc("get_shopify_setting", { 
      setting_name_param: 'shopify_token' 
    });
    
    const endpointPromise = supabase.rpc("get_shopify_setting", { 
      setting_name_param: 'shopify_api_endpoint' 
    });
    
    const [tokenResult, endpointResult] = await Promise.all([tokenPromise, endpointPromise]);
    
    if (tokenResult.error) {
      throw new Error(`Failed to retrieve API token: ${tokenResult.error.message}`);
    }
    
    if (endpointResult.error) {
      throw new Error(`Failed to retrieve API endpoint: ${endpointResult.error.message}`);
    }
    
    console.log(`API token: ${tokenResult.data ? 'Present' : 'Missing'}`);
    console.log(`API endpoint: ${endpointResult.data}`);
  } catch (error) {
    console.error('API connection test failed:', error);
    throw error;
  }
};

/**
 * Fetches active orders from Supabase
 */
export const fetchActiveOrders = async (): Promise<{
  orders: any[];
  lineItems?: Record<string, any[]>;
}> => {
  const { data: activeData, error: activeError } = await supabase
    .from('shopify_orders')
    .select('id, shopify_order_id, created_at, customer_name, items_count, status, imported_at, shopify_order_number');
  
  if (activeError) {
    console.error('Error fetching active orders:', activeError);
    throw new Error(`Failed to fetch orders from database: ${activeError.message}`);
  }
  
  console.log(`Retrieved ${activeData?.length || 0} active orders from database`);
  
  if (!activeData || activeData.length === 0) {
    return { orders: [] };
  }
  
  const orderIds = activeData.map(order => order.id);
  
  // Fetch line items for all orders in one query, now including location data
  const { data: lineItemsData, error: lineItemsError } = await supabase
    .from('shopify_order_items')
    .select('order_id, shopify_line_item_id, sku, title, quantity, price, location_id, location_name')
    .in('order_id', orderIds);
  
  if (lineItemsError) {
    console.error('Error fetching line items:', lineItemsError);
    // Return orders without line items
    return { orders: activeData };
  }
  
  console.log(`Retrieved ${lineItemsData?.length || 0} line items for active orders`);
  
  // Map line items to their respective orders
  if (lineItemsData) {
    const lineItemsByOrderId = lineItemsData.reduce((acc: Record<string, any[]>, item) => {
      if (!acc[item.order_id]) {
        acc[item.order_id] = [];
      }
      acc[item.order_id].push({
        id: item.shopify_line_item_id,
        sku: item.sku,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        location_id: item.location_id,
        location_name: item.location_name
      });
      return acc;
    }, {});
    
    return { orders: activeData, lineItems: lineItemsByOrderId };
  }
  
  return { orders: activeData };
};
