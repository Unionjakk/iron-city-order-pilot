
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

  // Check if a column exists in a table using RPC
  const checkColumnExists = async (tableName: string, columnName: string): Promise<boolean> => {
    try {
      // Check if we have cached the column existence result
      const { data: settingData, error: settingError } = await supabase
        .from('shopify_settings')
        .select('setting_value')
        .eq('setting_name', `column_exists_${tableName}_${columnName}`)
        .maybeSingle();
      
      if (settingError) {
        console.error(`Error checking if column ${columnName} exists in ${tableName}:`, settingError);
        return false;
      }
      
      // If we have cached data about this column, use it
      if (settingData) {
        return settingData.setting_value === 'true';
      }
      
      // Otherwise, use the column_exists function
      const { data: existsData, error: existsError } = await supabase
        .rpc('column_exists', { 
          table_name: tableName,
          column_name: columnName
        });
      
      if (existsError) {
        console.error(`Error with column_exists check for ${columnName} in ${tableName}:`, existsError);
        
        // Fallback: try to manually check using a select query
        try {
          // Use a dynamic query approach that's type-safe
          const query = `SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = '${tableName}'
              AND column_name = '${columnName}'
          ) as exists`;
          
          const { data: fallbackData, error: fallbackError } = await supabase.rpc('execute_sql', {
            sql: query
          });
          
          if (fallbackError) {
            console.error('Error with fallback query:', fallbackError);
            return false;
          }
          
          // Type-safe way to check if exists property is true
          if (fallbackData && fallbackData.length > 0) {
            const firstRow = fallbackData[0];
            if (typeof firstRow === 'object' && firstRow !== null && 'exists' in firstRow) {
              return Boolean(firstRow.exists);
            }
          }
          
          return false;
        } catch (error) {
          console.error('Exception with fallback query:', error);
          return false;
        }
      }
      
      // Cache the result for future checks
      await supabase
        .from('shopify_settings')
        .upsert({
          setting_name: `column_exists_${tableName}_${columnName}`,
          setting_value: existsData ? 'true' : 'false',
          updated_at: new Date().toISOString()
        });
      
      return !!existsData;
    } catch (error) {
      console.error(`Exception checking if column ${columnName} exists:`, error);
      return false;
    }
  };

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
      
      // Check if shopify_order_number column exists in the table
      const hasOrderNumberColumn = await checkColumnExists('shopify_orders', 'shopify_order_number');
      
      // Fetch active orders with basic information based on column availability
      let query = 'id, shopify_order_id, created_at, customer_name, items_count, status, imported_at, location_id, location_name';
      
      // Add shopify_order_number to the query if the column exists
      if (hasOrderNumberColumn) {
        query += ', shopify_order_number';
      }
      
      const { data: activeData, error: activeError } = await supabase
        .from('shopify_orders')
        .select(query);
      
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
            const orderObj: ShopifyOrder = {
              id: order.id,
              shopify_order_id: order.shopify_order_id,
              created_at: order.created_at,
              customer_name: order.customer_name,
              items_count: order.items_count,
              status: order.status,
              imported_at: order.imported_at,
              location_id: order.location_id,
              location_name: order.location_name,
              line_items: lineItemsByOrderId[order.id] || []
            };
            
            // Add shopify_order_number if it exists in the data
            if (hasOrderNumberColumn && 'shopify_order_number' in order) {
              orderObj.shopify_order_number = order.shopify_order_number || '';
            } else {
              // Use shopify_order_id as fallback
              orderObj.shopify_order_number = order.shopify_order_id;
            }
            
            return orderObj;
          });
          
          setImportedOrders(ordersWithLineItems);
        } else {
          const ordersWithoutLineItems = activeData.map((order) => {
            const orderObj: ShopifyOrder = {
              id: order.id,
              shopify_order_id: order.shopify_order_id,
              created_at: order.created_at,
              customer_name: order.customer_name,
              items_count: order.items_count,
              status: order.status,
              imported_at: order.imported_at,
              location_id: order.location_id,
              location_name: order.location_name,
              line_items: []
            };
            
            // Add shopify_order_number if it exists in the data
            if (hasOrderNumberColumn && 'shopify_order_number' in order) {
              orderObj.shopify_order_number = order.shopify_order_number || '';
            } else {
              // Use shopify_order_id as fallback
              orderObj.shopify_order_number = order.shopify_order_id;
            }
            
            return orderObj;
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
      
      // Check if shopify_order_number column exists in the archived orders table
      const hasArchivedOrderNumberColumn = await checkColumnExists('shopify_archived_orders', 'shopify_order_number');
      
      // Fetch archived orders - modify selection based on column availability
      let archivedQuery = 'id, shopify_order_id, created_at, customer_name, items_count, status, imported_at, archived_at, location_id, location_name';
      
      // Add shopify_order_number to the query if the column exists
      if (hasArchivedOrderNumberColumn) {
        archivedQuery += ', shopify_order_number';
      }
      
      const { data: archivedData, error: archivedError } = await supabase
        .from('shopify_archived_orders')
        .select(archivedQuery)
        .order('archived_at', { ascending: false })
        .limit(10);
        
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
              // Create a properly typed order object with the properties we know exist
              const typedOrder: ShopifyOrder = {
                id: order.id,
                shopify_order_id: order.shopify_order_id,
                created_at: order.created_at,
                customer_name: order.customer_name,
                items_count: order.items_count,
                status: order.status,
                imported_at: order.imported_at,
                archived_at: order.archived_at,
                location_id: order.location_id,
                location_name: order.location_name,
                line_items: lineItemsByOrderId[order.id] || []
              };
              
              // Add shopify_order_number if it exists in the data
              if (hasArchivedOrderNumberColumn && 'shopify_order_number' in order) {
                typedOrder.shopify_order_number = order.shopify_order_number || '';
              } else {
                // Use shopify_order_id as fallback
                typedOrder.shopify_order_number = order.shopify_order_id;
              }
              
              return typedOrder;
            });
            
            setArchivedOrders(archivedOrdersWithLineItems);
          } else {
            // Process each archived order without line items
            const archivedOrdersWithoutLineItems = archivedData.map((order) => {
              // Create a properly typed order object with the properties we know exist
              const typedOrder: ShopifyOrder = {
                id: order.id,
                shopify_order_id: order.shopify_order_id,
                created_at: order.created_at,
                customer_name: order.customer_name,
                items_count: order.items_count,
                status: order.status,
                imported_at: order.imported_at,
                archived_at: order.archived_at,
                location_id: order.location_id,
                location_name: order.location_name,
                line_items: []
              };
              
              // Add shopify_order_number if it exists in the data
              if (hasArchivedOrderNumberColumn && 'shopify_order_number' in order) {
                typedOrder.shopify_order_number = order.shopify_order_number || '';
              } else {
                // Use shopify_order_id as fallback 
                typedOrder.shopify_order_number = order.shopify_order_id;
              }
              
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
