
import { AlertCircle, Archive, MapPin, Package } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Order interface that matches our database schema
export interface ShopifyOrder {
  id: string;
  shopify_order_id: string;
  shopify_order_number?: string;
  created_at: string;
  customer_name: string;
  items_count: number;
  status: string;
  imported_at?: string;
  archived_at?: string;
  line_items?: Array<{
    id?: string;
    sku?: string;
    title: string;
    quantity: number;
    price?: number;
    location_id?: string;
    location_name?: string;
  }>;
}

interface OrdersTableProps {
  orders: ShopifyOrder[];
  showStatus?: boolean;
  emptyMessage?: string;
}

const OrdersTable = ({ orders, showStatus = true, emptyMessage = "No orders to display" }: OrdersTableProps) => {
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

  // Function to render the line items dialog
  const renderLineItemsDialog = (order: ShopifyOrder) => {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <button className="flex items-center text-orange-400 hover:text-orange-300 transition-colors text-sm">
            <Package className="h-3.5 w-3.5 mr-1" />
            {order.items_count} item{order.items_count !== 1 ? 's' : ''}
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-orange-500">
              Order #{order.shopify_order_number || order.shopify_order_id.substring(order.shopify_order_id.length - 6)} Items
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {order.customer_name} - {formatDate(order.created_at)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 max-h-[400px] overflow-y-auto pr-2">
            <Table>
              <TableHeader className="bg-zinc-800/50">
                <TableRow>
                  <TableHead className="text-zinc-400">SKU</TableHead>
                  <TableHead className="text-zinc-400">Item</TableHead>
                  <TableHead className="text-zinc-400 text-right">Qty</TableHead>
                  <TableHead className="text-zinc-400 text-right">Price</TableHead>
                  <TableHead className="text-zinc-400">Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.line_items && order.line_items.map((item, index) => (
                  <TableRow key={item.id || index} className="border-zinc-800 hover:bg-zinc-800/30">
                    <TableCell className="font-mono text-sm text-zinc-300">
                      {item.sku || 'N/A'}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {item.title}
                    </TableCell>
                    <TableCell className="text-zinc-300 text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-zinc-300 text-right">
                      {item.price ? `$${parseFloat(item.price.toString()).toFixed(2)}` : 'N/A'}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {item.location_name ? (
                        <div className="flex items-center">
                          <MapPin className="h-3.5 w-3.5 mr-1 text-orange-400" />
                          {item.location_name}
                        </div>
                      ) : (
                        <span className="text-zinc-500">Unknown</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(!order.line_items || order.line_items.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-zinc-500 py-4">
                      No line items available for this order
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-zinc-400">No orders to display</h3>
        <p className="text-zinc-500 mt-1">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-zinc-800/50">
          <TableRow>
            <TableHead className="text-zinc-400">Order Number</TableHead>
            <TableHead className="text-zinc-400">Shopify ID</TableHead>
            <TableHead className="text-zinc-400">Created</TableHead>
            <TableHead className="text-zinc-400">Customer</TableHead>
            <TableHead className="text-zinc-400">Items</TableHead>
            {showStatus && (
              <TableHead className="text-zinc-400">Status</TableHead>
            )}
            {orders.some(o => o.archived_at) && (
              <TableHead className="text-zinc-400">Archived</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="border-zinc-800 hover:bg-zinc-800/30">
              <TableCell className="font-medium text-zinc-300">
                #{order.shopify_order_number || 'N/A'}
              </TableCell>
              <TableCell className="text-zinc-400">
                #{order.shopify_order_id.substring(order.shopify_order_id.length - 6)}
              </TableCell>
              <TableCell className="text-zinc-400">
                {formatDate(order.created_at)}
              </TableCell>
              <TableCell className="text-zinc-300">
                {order.customer_name}
              </TableCell>
              <TableCell className="text-zinc-300">
                {renderLineItemsDialog(order)}
              </TableCell>
              {showStatus && (
                <TableCell>
                  {renderStatusBadge(order.status)}
                </TableCell>
              )}
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
