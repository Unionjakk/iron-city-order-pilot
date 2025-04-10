
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ShopifyOrder } from '@/components/shopify/OrdersTable';

export const useShopifyOrders = () => {
  const [importedOrders, setImportedOrders] = useState<ShopifyOrder[]>([]);
  const [lastImport, setLastImport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Function to fetch recent orders from Supabase
  const fetchRecentOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('shopify_orders')
        .select('id, shopify_order_id, created_at, customer_name, items_count, status, imported_at')
        .order('imported_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }
      
      if (data) {
        setImportedOrders(data as ShopifyOrder[]);
        
        // Set last import time if we have orders
        if (data.length > 0) {
          const latestOrder = data.reduce((latest, order) => {
            return new Date(latest.imported_at || '0') > new Date(order.imported_at || '0') 
              ? latest 
              : order;
          }, data[0]);
          
          setLastImport(latestOrder.imported_at || null);
        }
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
    lastImport,
    isLoading,
    fetchRecentOrders
  };
};
