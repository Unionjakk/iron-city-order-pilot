
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Archive, RefreshCw } from 'lucide-react';
import OrdersTable from '@/components/shopify/OrdersTable';
import { ShopifyOrder } from '@/components/shopify/OrdersTable';

interface OrdersViewCardProps {
  importedOrders: ShopifyOrder[];
  archivedOrders: ShopifyOrder[];
  ordersLoading: boolean;
}

const OrdersViewCard = ({ importedOrders, archivedOrders, ordersLoading }: OrdersViewCardProps) => {
  return (
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
  );
};

export default OrdersViewCard;
