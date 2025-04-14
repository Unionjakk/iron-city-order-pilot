
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
import { FileText, Loader2 } from 'lucide-react';

interface Order {
  hd_order_number: string;
  dealer_po_number: string | null;
  order_type: string | null;
  order_date: string | null;
}

const OrdersNeedingLineItems = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data: orders, error } = await supabase
          .from('hd_orders_with_lookup')
          .select('hd_order_number, dealer_po_number, order_type, order_date')
          .eq('has_line_items', false)
          .eq('is_excluded', false)
          .order('order_date', { ascending: false });

        if (error) throw error;
        
        setOrders(orders || []);
      } catch (err: any) {
        console.error('Error fetching orders:', err);
        setError(`Failed to load orders: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrders();
  }, []);
  
  if (error) {
    return (
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm mt-6">
        <CardHeader>
          <CardTitle className="text-red-500">Error Loading Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-300">{error}</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm mt-6">
      <CardHeader>
        <CardTitle className="flex items-center text-orange-500">
          <FileText className="mr-2 h-5 w-5" />
          Orders Needing Line Items
        </CardTitle>
        <CardDescription className="text-zinc-400">
          These orders are ready for line items to be uploaded
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
            <span className="ml-2 text-zinc-300">Loading orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            <p>No orders found that need line items</p>
          </div>
        ) : (
          <div className="rounded-md border border-zinc-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-800">
                <TableRow>
                  <TableHead className="text-zinc-300">HD Order Number</TableHead>
                  <TableHead className="text-zinc-300">Dealer PO</TableHead>
                  <TableHead className="text-zinc-300">Order Type</TableHead>
                  <TableHead className="text-zinc-300">Order Date</TableHead>
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
                      {order.order_type || '-'}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {order.order_date ? (
                        <FormattedDate date={order.order_date} />
                      ) : (
                        '-'
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

export default OrdersNeedingLineItems;
