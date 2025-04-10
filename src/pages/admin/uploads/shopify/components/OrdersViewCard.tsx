
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import OrdersTable from '@/components/shopify/OrdersTable';
import { ShopifyOrder } from '@/components/shopify/OrdersTable';

interface OrdersViewCardProps {
  importedOrders: ShopifyOrder[];
  archivedOrders: ShopifyOrder[];
  ordersLoading: boolean;
}

const OrdersViewCard = ({ 
  importedOrders, 
  ordersLoading 
}: OrdersViewCardProps) => {
  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-blue-500 flex items-center">
          <Package2 className="mr-2 h-5 w-5" /> Shopify Orders
        </CardTitle>
        <CardDescription className="text-zinc-400">
          All orders imported from Shopify
        </CardDescription>
      </CardHeader>
      <CardContent>
        {ordersLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full bg-zinc-800" />
            <Skeleton className="h-8 w-full bg-zinc-800" />
            <Skeleton className="h-8 w-full bg-zinc-800" />
          </div>
        ) : (
          <>
            <OrdersTable 
              orders={importedOrders} 
              showStatus={true}
              emptyMessage="No orders have been imported from Shopify yet."
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default OrdersViewCard;
