
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormattedDate } from '@/pages/admin/uploads/harley/components/FormattedDate';
import { RefreshCw, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ORDERS_SORT_FIELDS = {
  HD_ORDER_NUMBER: 'hd_order_number',
  UPDATED_DATE: 'updated_date',
  ORDER_DATE: 'order_date'
} as const;

type SortField = typeof ORDERS_SORT_FIELDS[keyof typeof ORDERS_SORT_FIELDS];
type SortDirection = 'asc' | 'desc';

interface OrderSummary {
  hd_order_number: string;
  dealer_po_number: string | null;
  order_date: string | null;
  contains_open_orders: boolean;
  has_shopify_match: boolean;
  updated_date: string | null;
}

const OrdersNeedingRefresh = () => {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('updated_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    const fetchOrderSummary = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let query = supabase
          .from('hd_orders_status_summary')
          .select('hd_order_number, dealer_po_number, order_date, contains_open_orders, has_shopify_match, updated_date')
          .eq('contains_open_orders', true);

        query = query.order(sortField, { ascending: sortDirection === 'asc' });

        const { data, error } = await query;

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
  }, [sortField, sortDirection]);

  const formatOpenOrdersStatus = (status: boolean | null) => {
    if (status === null) return "-";
    return status ? "Yes" : "No";
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((old) => (old === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc'
      ? <ArrowUp className="inline ml-1 h-3 w-3" />
      : <ArrowDown className="inline ml-1 h-3 w-3" />;
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
                  <TableHead 
                    className="text-zinc-300 cursor-pointer select-none" 
                    onClick={() => handleSort('hd_order_number')}
                  >
                    HD Order Number {getSortIcon('hd_order_number')}
                  </TableHead>
                  <TableHead className="text-zinc-300">Dealer PO Number</TableHead>
                  <TableHead 
                    className="text-zinc-300 cursor-pointer select-none"
                    onClick={() => handleSort('order_date')}
                  >
                    Order Date {getSortIcon('order_date')}
                  </TableHead>
                  <TableHead className="text-zinc-300">Contains Open Orders</TableHead>
                  <TableHead className="text-zinc-300">Has Shopify Match</TableHead>
                  <TableHead 
                    className="text-zinc-300 cursor-pointer select-none" 
                    onClick={() => handleSort('updated_date')}
                  >
                    Last Refreshed {getSortIcon('updated_date')}
                  </TableHead>
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
                      {order.contains_open_orders ? "True" : ""}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {order.has_shopify_match ? "True" : ""}
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
