
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, ExternalLink, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface ShopifyLineItem {
  id: string;
  title?: string;
  quantity?: number;
  price?: string;
  sku?: string;
  location_id?: string;
  location_name?: string;
}

export interface ShopifyOrder {
  id: string;
  shopify_order_id: string;
  shopify_order_number: string;
  created_at: string;
  customer_name: string;
  items_count: number;
  status: string;
  imported_at: string;
  line_items?: ShopifyLineItem[];
}

interface OrdersTableProps {
  orders: ShopifyOrder[];
  isLoading?: boolean;
  showStatus?: boolean;
  emptyMessage?: string;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ 
  orders, 
  isLoading = false,
  showStatus = true,
  emptyMessage = "No orders found"
}) => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const toggleExpand = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading orders...</div>;
  }

  if (!orders || orders.length === 0) {
    return <div className="text-center py-4">{emptyMessage}</div>;
  }

  // Function to format imported time
  const formatImportedTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return 'Unknown';
    }
  };

  return (
    <div className="border rounded-md border-zinc-800">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-800/50">
            <TableHead className="w-12"></TableHead>
            <TableHead>Order #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Items</TableHead>
            {showStatus && <TableHead>Status</TableHead>}
            <TableHead>Imported</TableHead>
            <TableHead className="text-right w-24">View</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <React.Fragment key={order.id}>
              <TableRow className="hover:bg-zinc-800/30">
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => toggleExpand(order.id)}
                  >
                    {expandedOrderId === order.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </TableCell>
                <TableCell className="font-medium">{order.shopify_order_number}</TableCell>
                <TableCell>
                  {new Date(order.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>{order.customer_name}</TableCell>
                <TableCell>{order.items_count}</TableCell>
                {showStatus && (
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={
                        order.status === 'fulfilled' ? 'border-green-500 text-green-500' :
                        order.status === 'partially_fulfilled' ? 'border-orange-500 text-orange-500' :
                        'border-blue-500 text-blue-500'
                      }
                    >
                      {order.status || 'unfulfilled'}
                    </Badge>
                  </TableCell>
                )}
                <TableCell>{formatImportedTime(order.imported_at)}</TableCell>
                <TableCell className="text-right">
                  <a 
                    href={`https://opus-harley-davidson.myshopify.com/admin/orders/${order.shopify_order_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-400 inline-flex items-center"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </TableCell>
              </TableRow>
              {expandedOrderId === order.id && order.line_items && order.line_items.length > 0 && (
                <TableRow className="hover:bg-transparent border-0">
                  <TableCell colSpan={showStatus ? 8 : 7} className="px-0 pt-0 pb-4">
                    <div className="bg-zinc-800/20 p-4 mx-4 rounded-md">
                      <h4 className="text-sm font-medium mb-2 text-zinc-300">Line Items</h4>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-zinc-800/30">
                            <TableHead>Item</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Location</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.line_items.map((item, index) => (
                            <TableRow key={item.id || index} className="hover:bg-zinc-800/20">
                              <TableCell className="font-medium">{item.title || 'Unknown Item'}</TableCell>
                              <TableCell>{item.sku || 'N/A'}</TableCell>
                              <TableCell>{item.quantity || 0}</TableCell>
                              <TableCell>
                                {item.price ? `$${parseFloat(item.price).toFixed(2)}` : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {item.location_name ? (
                                  <div className="flex items-center">
                                    <MapPin className="h-3 w-3 mr-1 text-blue-400" />
                                    {item.location_name}
                                  </div>
                                ) : 'Not specified'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrdersTable;
