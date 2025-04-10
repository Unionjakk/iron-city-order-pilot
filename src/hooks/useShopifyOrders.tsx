
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
      
      // Fetch active orders with all fields including shopify_order_number
      const { data: activeData, error: activeError } = await supabase
        .from('shopify_orders')
        .select('id, shopify_order_id, created_at, customer_name, items_count, status, imported_at, location_id, location_name, shopify_order_number');
      
      if (activeError) {
        console.error('Error fetching active orders:', activeError);
        toast({
          title: "Error",
          description: "Failed to fetch orders. Please try again later.",
          variant: "destructive",
        });
        setImportedOrders([]);
        setIsLoading(false);
        return;
      }
      
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
      
      // Fetch archived orders with all fields including shopify_order_number
      const { data: archivedData, error: archivedError } = await supabase
        .from('shopify_archived_orders')
        .select('id, shopify_order_id, created_at, customer_name, items_count, status, imported_at, archived_at, location_id, location_name, shopify_order_number')
        .order('archived_at', { ascending: false })
        .limit(10);
        
      if (archivedError) {
        console.error('Error fetching archived orders:', archivedError);
        setArchivedOrders([]);
      } else if (archivedData) {
        // If we have archived orders, fetch their line items
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
            const lineItemsByOrderId = archivedLineItemsData.reduce((acc: Record<string, any[]>, item) => {
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
            
            // Process each archived order
            const archivedOrdersWithLineItems = archivedData.map((order) => {
              return {
                id: order.id,
                shopify_order_id: order.shopify_order_id,
                shopify_order_number: order.shopify_order_number || order.shopify_order_id,
                created_at: order.created_at,
                customer_name: order.customer_name,
                items_count: order.items_count,
                status: order.status,
                imported_at: order.imported_at,
                archived_at: order.archived_at,
                location_id: order.location_id,
                location_name: order.location_name,
                line_items: lineItemsByOrderId[order.id] || []
              } as ShopifyOrder;
            });
            
            setArchivedOrders(archivedOrdersWithLineItems);
          } else {
            // Process each archived order without line items
            const archivedOrdersWithoutLineItems = archivedData.map((order) => {
              return {
                id: order.id,
                shopify_order_id: order.shopify_order_id,
                shopify_order_number: order.shopify_order_number || order.shopify_order_id,
                created_at: order.created_at,
                customer_name: order.customer_name,
                items_count: order.items_count,
                status: order.status,
                imported_at: order.imported_at,
                archived_at: order.archived_at,
                location_id: order.location_id,
                location_name: order.location_name,
                line_items: []
              } as ShopifyOrder;
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
