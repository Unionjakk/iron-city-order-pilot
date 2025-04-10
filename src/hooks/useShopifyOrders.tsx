
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ShopifyOrder } from '@/components/shopify/OrdersTable';
import { useToast } from '@/hooks/use-toast';

export const useShopifyOrders = () => {
  const [importedOrders, setImportedOrders] = useState<ShopifyOrder[]>([]);
  const [lastImport, setLastImport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoImportEnabled, setAutoImportEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Function to fetch recent orders from Supabase
  const fetchRecentOrders = async () => {
    setIsLoading(true);
    setError(null); // Clear any previous errors
    
    try {
      console.log("Fetching Shopify orders data from database...");
      
      // Try to get the last sync time from settings
      const { data: lastSyncData, error: syncError } = await supabase.rpc("get_shopify_setting", { 
        setting_name_param: 'last_sync_time' 
      });
      
      if (syncError) {
        console.error('Error checking for last sync time:', syncError);
        setError(`Error retrieving sync status: ${syncError.message}`);
      } else if (lastSyncData && typeof lastSyncData === 'string') {
        console.log(`Last sync time: ${lastSyncData}`);
        setLastImport(lastSyncData);
      }
      
      // Check if auto-import is enabled - make sure to check the exact string value 'true'
      const { data: autoImportData, error: autoImportError } = await supabase.rpc("get_shopify_setting", { 
        setting_name_param: 'auto_import_enabled' 
      });
      
      if (autoImportError) {
        console.error('Error checking auto-import setting:', autoImportError);
      } else {
        setAutoImportEnabled(autoImportData === 'true');
        console.log(`Auto import enabled: ${autoImportData === 'true'}`);
      }
      
      try {
        // Test API connection by getting token and endpoint
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
      } catch (apiError: any) {
        console.error('API connection test failed:', apiError);
        setError(`API configuration error: ${apiError.message}`);
      }
      
      // Fetch active orders with all fields including shopify_order_number
      const { data: activeData, error: activeError } = await supabase
        .from('shopify_orders')
        .select('id, shopify_order_id, created_at, customer_name, items_count, status, imported_at, location_id, location_name, shopify_order_number');
      
      if (activeError) {
        console.error('Error fetching active orders:', activeError);
        setError(`Failed to fetch orders from database: ${activeError.message}`);
        toast({
          title: "Error",
          description: "Failed to fetch orders. Please try again later.",
          variant: "destructive",
        });
        setImportedOrders([]);
        return;
      }
      
      console.log(`Retrieved ${activeData?.length || 0} active orders from database`);
      
      // If we have active orders, fetch their line items
      if (activeData && activeData.length > 0) {
        const orderIds = activeData.map(order => order.id);
        
        // Fetch line items for all orders in one query
        const { data: lineItemsData, error: lineItemsError } = await supabase
          .from('shopify_order_items')
          .select('order_id, shopify_line_item_id, sku, title, quantity, price')
          .in('order_id', orderIds);
        
        if (lineItemsError) {
          console.error('Error fetching line items:', lineItemsError);
        } else {
          console.log(`Retrieved ${lineItemsData?.length || 0} line items for active orders`);
        }
        
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
              price: item.price
            });
            return acc;
          }, {});
          
          // Add line items to each order and transform to ShopifyOrder type
          const ordersWithLineItems = activeData.map((order) => {
            return {
              id: order.id,
              shopify_order_id: order.shopify_order_id,
              shopify_order_number: order.shopify_order_number || order.shopify_order_id,
              created_at: order.created_at,
              customer_name: order.customer_name,
              items_count: order.items_count,
              status: order.status,
              imported_at: order.imported_at,
              location_id: order.location_id,
              location_name: order.location_name,
              line_items: lineItemsByOrderId[order.id] || []
            } as ShopifyOrder;
          });
          
          setImportedOrders(ordersWithLineItems);
        } else {
          // No line items, just map the orders
          const ordersWithoutLineItems = activeData.map((order) => {
            return {
              id: order.id,
              shopify_order_id: order.shopify_order_id,
              shopify_order_number: order.shopify_order_number || order.shopify_order_id,
              created_at: order.created_at,
              customer_name: order.customer_name,
              items_count: order.items_count,
              status: order.status,
              imported_at: order.imported_at,
              location_id: order.location_id,
              location_name: order.location_name,
              line_items: []
            } as ShopifyOrder;
          });
          
          setImportedOrders(ordersWithoutLineItems);
        }
        
        // Set last import time if we have orders and no last sync time
        if (activeData.length > 0 && !lastSyncData) {
          const latestOrder = activeData.reduce((latest, order) => {
            return new Date(latest.imported_at || '0') > new Date(order.imported_at || '0') 
              ? latest 
              : order;
          }, activeData[0]);
          
          setLastImport(latestOrder.imported_at || null);
        }
      } else {
        setImportedOrders([]);
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      setError(`An unexpected error occurred while fetching orders: ${error.message}`);
      toast({
        title: "Error",
        description: "Failed to fetch orders. Please check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchRecentOrders();
  }, []);

  return {
    importedOrders,
    lastImport,
    isLoading,
    autoImportEnabled,
    fetchRecentOrders,
    error
  };
};
