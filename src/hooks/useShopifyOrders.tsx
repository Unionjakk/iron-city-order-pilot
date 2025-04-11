
import { useState, useEffect } from 'react';
import { ShopifyOrder } from '@/components/shopify/OrdersTable';
import { useToast } from '@/hooks/use-toast';
import { 
  getLastSyncTime, 
  getAutoImportStatus, 
  testApiConnection, 
  fetchActiveOrders 
} from '@/services/shopify/shopifyOrdersService';
import { 
  transformOrdersData, 
  determineLastImportTime 
} from '@/utils/shopify/orderTransformUtils';

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
      const lastSyncTime = await getLastSyncTime();
      if (lastSyncTime) {
        setLastImport(lastSyncTime);
      }
      
      // Check if auto-import is enabled
      const isAutoImportEnabled = await getAutoImportStatus();
      setAutoImportEnabled(isAutoImportEnabled);
      
      // Test API connection
      await testApiConnection();
      
      // Fetch active orders with line items
      const { orders, lineItems } = await fetchActiveOrders();
      
      // Transform orders data
      const transformedOrders = transformOrdersData(orders, lineItems);
      setImportedOrders(transformedOrders);
      
      // Determine last import time if not set from settings
      if (!lastSyncTime && orders.length > 0) {
        const calculatedLastImport = determineLastImportTime(lastSyncTime, orders);
        setLastImport(calculatedLastImport);
      }
      
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      setError(`An unexpected error occurred while fetching orders: ${error.message}`);
      toast({
        title: "Error",
        description: "Failed to fetch orders. Please check console for details.",
        variant: "destructive",
      });
      setImportedOrders([]);
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
