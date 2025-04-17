
import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormattedDate } from '@/pages/admin/uploads/harley/components/FormattedDate';
import { RefreshCw, Loader2 } from 'lucide-react';

interface OrderSummary {
  hd_order_number: string;
  dealer_po_number: string | null;
  order_date: string | null;
  contains_open_orders: boolean;
  updated_date: string | null;
}

const OrdersNeedingRefresh = () => {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderSummary = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('hd_orders_status_summary')
          .select('hd_order_number, dealer_po_number, order_date, contains_open_orders, updated_date')
          .eq('contains_open_orders', true) // Filter only where contains_open_orders is true
          .order('updated_date', { ascending: true });
        
        if (error) throw error;
        
        setOrders(data || []);
      } catch (err: any) {
        console.error('Error fetching order summary:', err);
        setError(`Failed to load order summary: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrderSummary();
  }, []);
  
  const formatOpenOrdersStatus = (status: boolean | null) => {
    if (status === null) return "-";
    return status ? "Yes" : "No";
  };
  
  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm mt-6">
      <CardHeader>
        <CardTitle className="flex items-center text-orange-500">
          <RefreshCw className="mr-2 h-5 w-5" />
          Open Orders that will need refreshing
        </CardTitle>
        <CardDescription className="text-zinc-400">
          These orders may need to have their line items refreshed
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
            <span className="ml-2 text-zinc-300">Loading order summary...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-400">
            <p>{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            <p>No orders found that need refreshing</p>
          </div>
        ) : (
          <div className="rounded-md border border-zinc-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-800">
                <TableRow>
                  <TableHead className="text-zinc-300">HD Order Number</TableHead>
                  <TableHead className="text-zinc-300">Dealer PO Number</TableHead>
                  <TableHead className="text-zinc-300">Order Date</TableHead>
                  <TableHead className="text-zinc-300">Contains Open Orders</TableHead>
                  <TableHead className="text-zinc-300">Last Refreshed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow 
                    key={order.hd_order_number}
                    className="bg-zinc-900 hover:bg-zinc-800"
                  >
                    <TableCell className="font-medium text-orange-400">
                      {order.hd_order_number}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {order.dealer_po_number || '-'}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {order.order_date ? (
                        <FormattedDate date={order.order_date} />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {formatOpenOrdersStatus(order.contains_open_orders)}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {order.updated_date ? (
                        <FormattedDate date={order.updated_date} />
                      ) : (
                        'Never'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrdersNeedingRefresh;
