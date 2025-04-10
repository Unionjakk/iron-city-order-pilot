
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Shield, Archive } from 'lucide-react';
import { useShopifyOrders } from '@/hooks/useShopifyOrders';
import ApiTokenFormComponent from '@/components/shopify/ApiTokenForm';
import ImportControls from '@/components/shopify/ImportControls';
import OrdersTable from '@/components/shopify/OrdersTable';
import ApiDocumentation from '@/components/shopify/ApiDocumentation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';

const ShopifyAPI = () => {
  const [hasToken, setHasToken] = useState(false);
  const [maskedToken, setMaskedToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { importedOrders, archivedOrders, lastImport, fetchRecentOrders } = useShopifyOrders();

  // Function to mask the token for display
  const maskToken = (token: string) => {
    if (!token || token.length <= 8) return '********';
    return token.substring(0, 4) + '********' + token.substring(token.length - 4);
  };

  // Function to check for token in the database
  const checkForToken = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('shopify_settings')
        .select('setting_value')
        .eq('setting_name', 'shopify_token')
        .single();
      
      if (error) {
        console.error('Error checking for token in database:', error);
        setHasToken(false);
        setMaskedToken('');
        return;
      }
      
      if (data && data.setting_value && data.setting_value !== 'placeholder_token') {
        setHasToken(true);
        setMaskedToken(maskToken(data.setting_value));
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">Shopify API Integration</h1>
        <p className="text-orange-400/80">Configure and manage Shopify order imports</p>
      </div>
      
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
          <CardHeader>
            <CardTitle className="text-orange-500 flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5" /> Order Import Controls
            </CardTitle>
            <CardDescription className="text-zinc-400">Manage Shopify unfulfilled order imports</CardDescription>
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
                <OrdersTable orders={importedOrders} />
                
                <div className="mt-4 text-sm text-zinc-500">
                  {importedOrders.length > 0 
                    ? `Showing ${importedOrders.length} active orders. Orders will automatically progress through the fulfillment workflow.`
                    : 'No active orders to display. Import orders from Shopify to begin the fulfillment process.'}
                </div>
              </TabsContent>
              
              <TabsContent value="archived">
                <OrdersTable orders={archivedOrders} />
                
                <div className="mt-4 text-sm text-zinc-500">
                  {archivedOrders.length > 0 
                    ? `Showing ${archivedOrders.length} archived orders. These orders have been fulfilled or removed from the active workflow.`
                    : 'No archived orders to display yet. Orders are archived when they are fulfilled in Shopify.'}
                </div>
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
