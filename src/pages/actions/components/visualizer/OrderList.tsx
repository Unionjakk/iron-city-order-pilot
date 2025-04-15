
import { PicklistOrder } from "../../types/picklistTypes";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import StatusBadge from "./StatusBadge";
import ProgressBar from "./ProgressBar";

interface OrderListProps {
  orders: PicklistOrder[];
}

const OrderList = ({ orders }: OrderListProps) => {
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  
  const toggleOrderExpanded = (orderId: string) => {
    const newExpandedOrders = new Set(expandedOrders);
    if (newExpandedOrders.has(orderId)) {
      newExpandedOrders.delete(orderId);
    } else {
      newExpandedOrders.add(orderId);
    }
    setExpandedOrders(newExpandedOrders);
  };
  
  // Helper to get status counts for an order
  const getStatusCounts = (order: PicklistOrder) => {
    const counts: Record<string, number> = {};
    
    order.items.forEach(item => {
      const status = item.progress || "Unknown";
      counts[status] = (counts[status] || 0) + 1;
    });
    
    return counts;
  };
  
  // Helper to format dates
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Order #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map(order => {
            const isExpanded = expandedOrders.has(order.id);
            const statusCounts = getStatusCounts(order);
            
            return (
              <>
                <TableRow key={order.id}>
                  <TableCell className="w-10">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleOrderExpanded(order.id)} 
                      className="h-8 w-8 p-0"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">
                    {order.shopify_order_number}
                  </TableCell>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell>{formatDate(order.created_at)}</TableCell>
                  <TableCell>{order.items.length}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(statusCounts).slice(0, 2).map(([status, count]) => (
                        <StatusBadge 
                          key={status} 
                          status={status} 
                          count={count} 
                        />
                      ))}
                      {Object.keys(statusCounts).length > 2 && (
                        <span className="text-xs text-gray-500">+{Object.keys(statusCounts).length - 2} more</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="w-32">
                    <ProgressBar order={order} />
                  </TableCell>
                </TableRow>
                
                {isExpanded && (
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={7} className="p-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items.map(item => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.title}</TableCell>
                              <TableCell>{item.sku || "No SKU"}</TableCell>
                              <TableCell>
                                {item.quantity}
                                {item.quantity_required && (
                                  <div className="text-xs text-gray-500">
                                    {item.quantity_picked} of {item.quantity_required} picked
                                    {item.is_partial && " (Partial)"}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={item.progress} showCount={false} />
                              </TableCell>
                              <TableCell>
                                {item.stock_quantity !== null ? (
                                  <span>{item.stock_quantity} {item.bin_location && `(${item.bin_location})`}</span>
                                ) : (
                                  <span className="text-gray-500">Unknown</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {item.notes ? (
                                  <span className="text-xs italic">{item.notes}</span>
                                ) : (
                                  <span className="text-gray-500">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrderList;
