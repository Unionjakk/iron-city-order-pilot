import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Shield, Archive, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { useShopifyOrders } from '@/hooks/useShopifyOrders';
import ApiTokenFormComponent from '@/components/shopify/ApiTokenForm';
import ImportControls from '@/components/shopify/ImportControls';
import OrdersTable from '@/components/shopify/OrdersTable';
import ApiDocumentation from '@/components/shopify/ApiDocumentation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

// IMPORTANT: This component interacts with a PRODUCTION Shopify API
// Any changes must maintain compatibility with the live system
const ShopifyAPI = () => {
  const [hasToken, setHasToken] = useState(false);
  const [maskedToken, setMaskedToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSchemaError, setIsSchemaError] = useState(false);
  const { importedOrders, archivedOrders, lastImport, fetchRecentOrders, isLoading: ordersLoading } = useShopifyOrders();

  // The special value 'placeholder_token' represents no token being set
  const PLACEHOLDER_TOKEN_VALUE = 'placeholder_token';

  // Function to mask the token for display
  const maskToken = (token: string) => {
    if (!token || token.length <= 8) return '********';
    return token.substring(0, 4) + '********' + token.substring(token.length - 4);
  };

  // Check if a column exists in a table
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
          // Try to query the table with a limit of 1 row
          const { data: tableData, error: tableError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (tableError) {
            console.error('Error with fallback query:', tableError);
            return false;
          }
          
          // If we got a row, check if the column exists in the first row
          if (tableData && tableData.length > 0) {
            return columnName in tableData[0];
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

  // Check if there's a schema error by checking if the column exists
  const checkForSchemaErrors = async () => {
    try {
      const columnExists = await checkColumnExists('shopify_orders', 'shopify_order_number');
      setIsSchemaError(!columnExists);
    } catch (error) {
      console.error('Exception checking schema:', error);
      setIsSchemaError(true);
    }
  };

  // Function to check for token in the database
  const checkForToken = async () => {
    setIsLoading(true);
    try {
      // Using RPC for type safety
      const { data, error } = await supabase.rpc('get_shopify_setting', { 
        setting_name_param: 'shopify_token' 
      });
      
      if (error) {
        console.error('Error checking for token in database:', error);
        setHasToken(false);
        setMaskedToken('');
        return;
      }
      
      // Check if we have a valid token (not the placeholder)
      if (data && typeof data === 'string' && data !== PLACEHOLDER_TOKEN_VALUE) {
        setHasToken(true);
        setMaskedToken(maskToken(data));
      } else {
        setHasToken(false);
        setMaskedToken('');
      }
    } catch (error) {
      console.error('Exception checking for token:', error);
      setHasToken(false);
      setMaskedToken('');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial check on component mount
  useEffect(() => {
    checkForToken();
    checkForSchemaErrors();
    
    // Set up a subscription to token changes
    const channel = supabase
      .channel('shopify_settings_changes')
      .on('postgres_changes', 
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shopify_settings',
          filter: 'setting_name=eq.shopify_token'
        }, 
        () => {
          checkForToken();
        })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle refresh button click
  const handleRefresh = () => {
    fetchRecentOrders();
    checkForSchemaErrors();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">Shopify API Integration</h1>
        <p className="text-orange-400/80">Configure and manage Shopify order imports</p>
      </div>
      
      <Alert className="bg-zinc-800/60 border-amber-500/50">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <AlertTitle className="text-amber-500">Production System</AlertTitle>
        <AlertDescription className="text-zinc-300">
          This is a real production system connected to the live Shopify store. All actions here will affect the actual store data.
        </AlertDescription>
      </Alert>
      
      {/* Schema Error Alert */}
      {isSchemaError && (
        <Alert className="bg-zinc-800/60 border-red-500/50">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <AlertTitle className="text-red-500">Database Schema Error</AlertTitle>
          <AlertDescription className="text-zinc-300">
            The database schema needs to be updated. The required column 'shopify_order_number' is missing from the shopify_orders table.
          </AlertDescription>
        </Alert>
      )}
      
      {/* API Configuration Card */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-orange-500 flex items-center">
            <Shield className="mr-2 h-5 w-5" /> Shopify API Configuration
          </CardTitle>
          <CardDescription className="text-zinc-400">Securely connect to your Shopify store</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-4 text-zinc-400">
              Loading API configuration...
            </div>
          ) : (
            <ApiTokenFormComponent 
              hasToken={hasToken} 
              maskedToken={maskedToken} 
              setHasToken={setHasToken} 
              setMaskedToken={setMaskedToken} 
            />
          )}
        </CardContent>
      </Card>
      
      {/* Import Controls */}
      {hasToken && (
        <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-orange-500 flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5" /> Order Import Controls
              </CardTitle>
              <CardDescription className="text-zinc-400">Manage Shopify unfulfilled order imports</CardDescription>
            </div>
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm"
              disabled={ordersLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${ordersLoading ? 'animate-spin' : ''}`} />
              Refresh Status
            </Button>
          </CardHeader>
          <CardContent>
            <ImportControls 
              lastImport={lastImport} 
              fetchRecentOrders={fetchRecentOrders} 
            />
          </CardContent>
        </Card>
      )}
      
      {/* Orders with Tabs for Active and Archived */}
      {hasToken && (
        <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-orange-500">Shopify Orders</CardTitle>
            <CardDescription className="text-zinc-400">
              View and manage your orders from Shopify
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="w-full mb-4 bg-zinc-800">
                <TabsTrigger value="active" className="flex-1">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Active Orders
                </TabsTrigger>
                <TabsTrigger value="archived" className="flex-1">
                  <Archive className="mr-2 h-4 w-4" />
                  Archived Orders
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="active">
                {ordersLoading ? (
                  <div className="py-8 text-center text-zinc-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading orders...
                  </div>
                ) : isSchemaError ? (
                  <div className="py-8 text-center text-amber-400">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                    <p>Database schema needs to be updated.</p>
                    <p className="text-sm text-zinc-500 mt-2">The required column 'shopify_order_number' is missing.</p>
                  </div>
                ) : (
                  <>
                    <OrdersTable orders={importedOrders} />
                    
                    <div className="mt-4 text-sm text-zinc-500">
                      {importedOrders.length > 0 
                        ? `Showing ${importedOrders.length} active orders. Orders will automatically progress through the fulfillment workflow.`
                        : 'No active orders to display. Import orders from Shopify to begin the fulfillment process.'}
                    </div>
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="archived">
                {ordersLoading ? (
                  <div className="py-8 text-center text-zinc-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading archived orders...
                  </div>
                ) : isSchemaError ? (
                  <div className="py-8 text-center text-amber-400">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                    <p>Database schema needs to be updated.</p>
                    <p className="text-sm text-zinc-500 mt-2">The required column 'shopify_order_number' is missing.</p>
                  </div>
                ) : (
                  <>
                    <OrdersTable orders={archivedOrders} />
                    
                    <div className="mt-4 text-sm text-zinc-500">
                      {archivedOrders.length > 0 
                        ? `Showing ${archivedOrders.length} archived orders. These orders have been fulfilled or removed from the active workflow.`
                        : 'No archived orders to display yet. Orders are archived when they are fulfilled in Shopify.'}
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
      
      {/* API Documentation */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-orange-500">API Integration Details</CardTitle>
          <CardDescription className="text-zinc-400">Technical information about the Shopify integration</CardDescription>
        </CardHeader>
        <CardContent>
          <ApiDocumentation />
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopifyAPI;
