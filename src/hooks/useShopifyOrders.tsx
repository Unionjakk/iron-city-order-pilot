
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ShopifyOrder } from '@/components/shopify/OrdersTable';
import { useToast } from '@/hooks/use-toast';

export const useShopifyOrders = () => {
  const [importedOrders, setImportedOrders] = useState<ShopifyOrder[]>([]);
  const [archivedOrders, setArchivedOrders] = useState<ShopifyOrder[]>([]);
  const [lastImport, setLastImport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoImportEnabled, setAutoImportEnabled] = useState(false);
  const { toast } = useToast();

  // Function to fetch recent orders from Supabase
  const fetchRecentOrders = async () => {
    setIsLoading(true);
    try {
      // Try to get the last sync time from settings
      const { data: lastSyncData } = await supabase.rpc('get_shopify_setting', { 
        setting_name_param: 'last_sync_time' 
      });
      
      if (lastSyncData && typeof lastSyncData === 'string') {
        setLastImport(lastSyncData);
      }
      
      // Check if auto-import is enabled - make sure to check the exact string value 'true'
      const { data: autoImportData } = await supabase.rpc('get_shopify_setting', { 
        setting_name_param: 'auto_import_enabled' 
      });
      
      setAutoImportEnabled(autoImportData === 'true');
      
      // Fetch active orders with basic information
      // First, try with shopify_order_number included in the query
      let activeData;
      let activeError;
      
      try {
        // Try with shopify_order_number included (which might not exist yet)
        const activeResult = await supabase
          .from('shopify_orders')
          .select('id, shopify_order_id, shopify_order_number, created_at, customer_name, items_count, status, imported_at, location_id, location_name');
          
        activeData = activeResult.data;
        activeError = activeResult.error;
      } catch (err) {
        // If that fails, try without shopify_order_number
        console.warn('Falling back to query without shopify_order_number', err);
        const fallbackResult = await supabase
          .from('shopify_orders')
          .select('id, shopify_order_id, created_at, customer_name, items_count, status, imported_at, location_id, location_name');
          
        activeData = fallbackResult.data;
        activeError = fallbackResult.error;
      }
      
      if (activeError) {
        console.error('Error fetching active orders:', activeError);
        toast({
          title: "Error",
          description: "Failed to fetch orders. The database schema may need to be updated.",
          variant: "destructive",
        });
        setImportedOrders([]);
        setIsLoading(false);
        return;
      }
      
      // Fetch line items for each active order from the new shopify_order_items table
      if (activeData && activeData.length > 0) {
        const orderIds = activeData.map(order => order.id);
        
        // Fetch line items for all orders in one query
        const { data: lineItemsData, error: lineItemsError } = await supabase
          .from('shopify_order_items')
          .select('order_id, shopify_line_item_id, sku, title, quantity, price')
          .in('order_id', orderIds);
        
        if (lineItemsError) {
          console.error('Error fetching line items:', lineItemsError);
        }
        
        // Map line items to their respective orders
        if (lineItemsData) {
          const lineItemsByOrderId = lineItemsData.reduce((acc, item) => {
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
          const ordersWithLineItems = activeData.map(order => ({
            ...order,
            // Use shopify_order_number if available, otherwise use empty string as fallback
            shopify_order_number: order.shopify_order_number || '',
            line_items: lineItemsByOrderId[order.id] || []
          })) as ShopifyOrder[];
          
          setImportedOrders(ordersWithLineItems);
        } else {
          setImportedOrders(activeData.map(order => ({
            ...order,
            shopify_order_number: order.shopify_order_number || '',
            line_items: []
          })) as ShopifyOrder[]);
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
      
      // Fetch archived orders - using the RPC function to avoid type issues
      // Try using the updated RPC function that includes shopify_order_number
      const { data: archivedData, error: archivedError } = await supabase
        .rpc('get_archived_shopify_orders', { limit_count: 10 });
        
      if (archivedError) {
        console.error('Error fetching archived orders:', archivedError);
        setArchivedOrders([]);
      } else if (archivedData) {
        // If we have archived orders, fetch their line items from the new shopify_archived_order_items table
        if (archivedData.length > 0) {
          const archivedOrderIds = archivedData.map(order => order.id);
          
          // Fetch archived line items
          const { data: archivedLineItemsData, error: archivedLineItemsError } = await supabase
            .from('shopify_archived_order_items')
            .select('archived_order_id, shopify_line_item_id, sku, title, quantity, price')
            .in('archived_order_id', archivedOrderIds);
          
          if (archivedLineItemsError) {
            console.error('Error fetching archived line items:', archivedLineItemsError);
          }
          
          // Map archived line items to their respective orders
          if (archivedLineItemsData) {
            const lineItemsByOrderId = archivedLineItemsData.reduce((acc, item) => {
              if (!acc[item.archived_order_id]) {
                acc[item.archived_order_id] = [];
              }
              acc[item.archived_order_id].push({
                id: item.shopify_line_item_id,
                sku: item.sku,
                title: item.title,
                quantity: item.quantity,
                price: item.price
              });
              return acc;
            }, {});
            
            // Process each archived order - with safe access to shopify_order_number
            const archivedOrdersWithLineItems = archivedData.map(order => {
              // First create a properly typed order object with the properties we know exist
              const typedOrder: ShopifyOrder = {
                id: order.id,
                shopify_order_id: order.shopify_order_id,
                created_at: order.created_at,
                customer_name: order.customer_name,
                items_count: order.items_count,
                status: order.status,
                // Add the optional properties safely
                shopify_order_number: (order as any).shopify_order_number || '',
                imported_at: order.imported_at,
                archived_at: order.archived_at,
                location_id: order.location_id,
                location_name: order.location_name,
                line_items: lineItemsByOrderId[order.id] || []
              };
              
              return typedOrder;
            });
            
            setArchivedOrders(archivedOrdersWithLineItems);
          } else {
            // Process each archived order without line items
            const archivedOrdersWithoutLineItems = archivedData.map(order => {
              // First create a properly typed order object with the properties we know exist
              const typedOrder: ShopifyOrder = {
                id: order.id,
                shopify_order_id: order.shopify_order_id,
                created_at: order.created_at,
                customer_name: order.customer_name,
                items_count: order.items_count,
                status: order.status,
                // Add the optional properties safely
                shopify_order_number: (order as any).shopify_order_number || '',
                imported_at: order.imported_at,
                archived_at: order.archived_at,
                location_id: order.location_id,
                location_name: order.location_name,
                line_items: []
              };
              
              return typedOrder;
            });
            
            setArchivedOrders(archivedOrdersWithoutLineItems);
          }
        } else {
          setArchivedOrders([]);
        }
      } else {
        setArchivedOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders. Please try again later.",
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
    archivedOrders,
    lastImport,
    isLoading,
    autoImportEnabled,
    fetchRecentOrders
  };
};
