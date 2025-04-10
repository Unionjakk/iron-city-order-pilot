
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ShopifyOrder } from '@/components/shopify/OrdersTable';

export const useShopifyOrders = () => {
  const [importedOrders, setImportedOrders] = useState<ShopifyOrder[]>([]);
  const [archivedOrders, setArchivedOrders] = useState<ShopifyOrder[]>([]);
  const [lastImport, setLastImport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Function to fetch recent orders from Supabase
  const fetchRecentOrders = async () => {
    setIsLoading(true);
    try {
      // Fetch active orders
      const { data: activeData, error: activeError } = await supabase
        .from('shopify_orders')
        .select('id, shopify_order_id, created_at, customer_name, items_count, status, imported_at')
        .order('imported_at', { ascending: false })
        .limit(10);
      
      if (activeError) {
        console.error('Error fetching active orders:', activeError);
        return;
      }
      
      // Fetch archived orders - using the RPC function to avoid type issues
      const { data: archivedData, error: archivedError } = await supabase
        .rpc('get_archived_shopify_orders', { limit_count: 10 });
        
      if (archivedError) {
        console.error('Error fetching archived orders:', archivedError);
      }
      
      if (activeData) {
        setImportedOrders(activeData as ShopifyOrder[]);
        
        // Set last import time if we have orders
        if (activeData.length > 0) {
          const latestOrder = activeData.reduce((latest, order) => {
            return new Date(latest.imported_at || '0') > new Date(order.imported_at || '0') 
              ? latest 
              : order;
          }, activeData[0]);
          
          setLastImport(latestOrder.imported_at || null);
        }
      }
      
      if (archivedData) {
        setArchivedOrders(archivedData as ShopifyOrder[]);
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
    fetchRecentOrders
  };
};
