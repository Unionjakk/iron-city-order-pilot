
import { AlertCircle, Archive } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Order interface that matches our database schema
export interface ShopifyOrder {
  id: string;
  shopify_order_id: string;
  created_at: string;
  customer_name: string;
  items_count: number;
  status: string;
  imported_at?: string;
  archived_at?: string;
}

interface OrdersTableProps {
  orders: ShopifyOrder[];
}

const OrdersTable = ({ orders }: OrdersTableProps) => {
  // Function to render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'imported':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Imported</Badge>;
      case 'stock_checked':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Stock Checked</Badge>;
      case 'partial_pick':
        return <Badge className="bg-orange-500 hover:bg-orange-600">Partial Pick</Badge>;
      case 'backordered':
        return <Badge className="bg-red-500 hover:bg-red-600">Backordered</Badge>;
      case 'fulfilled':
        return <Badge className="bg-green-500 hover:bg-green-600">Fulfilled</Badge>;
      case 'archived':
        return <Badge className="bg-purple-500 hover:bg-purple-600">Archived</Badge>;
      default:
        return <Badge className="bg-zinc-500 hover:bg-zinc-600">{status}</Badge>;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-zinc-400">No orders to display</h3>
        <p className="text-zinc-500 mt-1">
          {orders.some(o => o.archived_at) 
            ? "No archived orders found. Orders are archived when they're fulfilled in Shopify."
            : "When you import orders from Shopify, they will appear here."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-zinc-800/50">
          <TableRow>
            <TableHead className="text-zinc-400">Order ID</TableHead>
            <TableHead className="text-zinc-400">Created</TableHead>
            <TableHead className="text-zinc-400">Customer</TableHead>
            <TableHead className="text-zinc-400">Items</TableHead>
            <TableHead className="text-zinc-400">Status</TableHead>
            {orders.some(o => o.archived_at) && (
              <TableHead className="text-zinc-400">Archived</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="border-zinc-800 hover:bg-zinc-800/30">
              <TableCell className="font-medium text-zinc-300">
                #{order.shopify_order_id}
              </TableCell>
              <TableCell className="text-zinc-400">
                {formatDate(order.created_at)}
              </TableCell>
              <TableCell className="text-zinc-300">
                {order.customer_name}
              </TableCell>
              <TableCell className="text-zinc-300">
                {order.items_count}
              </TableCell>
              <TableCell>
                {renderStatusBadge(order.status)}
              </TableCell>
              {orders.some(o => o.archived_at) && (
                <TableCell className="text-zinc-400">
                  {order.archived_at ? formatDate(order.archived_at) : '-'}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrdersTable;
