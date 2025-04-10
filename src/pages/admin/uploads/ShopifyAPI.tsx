
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ShoppingCart, Shield } from 'lucide-react';
import { useShopifyOrders } from '@/hooks/useShopifyOrders';
import ApiTokenFormComponent from '@/components/shopify/ApiTokenForm';
import ImportControls from '@/components/shopify/ImportControls';
import OrdersTable from '@/components/shopify/OrdersTable';
import ApiDocumentation from '@/components/shopify/ApiDocumentation';

const ShopifyAPI = () => {
  const [hasToken, setHasToken] = useState(false);
  const [maskedToken, setMaskedToken] = useState('');
  const { importedOrders, lastImport, fetchRecentOrders } = useShopifyOrders();

  // Check for existing token on component mount
  useEffect(() => {
    const checkExistingToken = () => {
      const hasExistingToken = localStorage.getItem('shopify_token') !== null;
      
      if (hasExistingToken) {
        const token = localStorage.getItem('shopify_token') || '';
        const masked = maskToken(token);
        setMaskedToken(masked);
        setHasToken(true);
      }
    };
    
    checkExistingToken();
  }, []);

  // Function to mask the token for display
  const maskToken = (token: string) => {
    if (token.length <= 8) return '********';
    return token.substring(0, 4) + '********' + token.substring(token.length - 4);
  };

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
          <ApiTokenFormComponent 
            hasToken={hasToken} 
            maskedToken={maskedToken} 
            setHasToken={setHasToken} 
            setMaskedToken={setMaskedToken} 
          />
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
      
      {/* Recent Imports */}
      {hasToken && (
        <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-orange-500">Recent Imported Orders</CardTitle>
            <CardDescription className="text-zinc-400">
              View and manage your recently imported orders from Shopify
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrdersTable orders={importedOrders} />
          </CardContent>
          <CardFooter className="border-t border-zinc-800 bg-zinc-900/30 px-6 py-3">
            <div className="text-sm text-zinc-500">
              {importedOrders.length > 0 
                ? `Showing ${importedOrders.length} orders. Orders will automatically progress through the fulfillment workflow.`
                : 'No orders to display. Import orders from Shopify to begin the fulfillment process.'}
            </div>
          </CardFooter>
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
