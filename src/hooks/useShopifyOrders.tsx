
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ShopifyOrder } from '@/components/shopify/OrdersTable';

export const useShopifyOrders = () => {
  const [importedOrders, setImportedOrders] = useState<ShopifyOrder[]>([]);
  const [archivedOrders, setArchivedOrders] = useState<ShopifyOrder[]>([]);
  const [lastImport, setLastImport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoImportEnabled, setAutoImportEnabled] = useState(false);

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
      const { data: activeData, error: activeError } = await supabase
        .from('shopify_orders')
        .select('id, shopify_order_id, shopify_order_number, created_at, customer_name, items_count, status, imported_at, location_id, location_name')
        .order('imported_at', { ascending: false })
        .limit(10);
      
      if (activeError) {
        console.error('Error fetching active orders:', activeError);
        return;
      }
      
      // Fetch line items for each active order
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
          
          // Add line items to each order
          const ordersWithLineItems = activeData.map(order => ({
            ...order,
            line_items: lineItemsByOrderId[order.id] || []
          }));
          
          setImportedOrders(ordersWithLineItems as ShopifyOrder[]);
        } else {
          setImportedOrders(activeData as ShopifyOrder[]);
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
      const { data: archivedData, error: archivedError } = await supabase
        .rpc('get_archived_shopify_orders', { limit_count: 10 });
        
      if (archivedError) {
        console.error('Error fetching archived orders:', archivedError);
      }
      
      // If we have archived orders, fetch their line items
      if (archivedData && archivedData.length > 0) {
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
          
          // Add line items to each archived order
          const archivedOrdersWithLineItems = archivedData.map(order => ({
            ...order,
            line_items: lineItemsByOrderId[order.id] || []
          }));
          
          setArchivedOrders(archivedOrdersWithLineItems as ShopifyOrder[]);
        } else {
          setArchivedOrders(archivedData as ShopifyOrder[]);
        }
      } else {
        setArchivedOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
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
