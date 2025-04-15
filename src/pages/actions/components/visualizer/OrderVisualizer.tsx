
import { PicklistOrder } from "../../types/picklistTypes";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Calendar, User, Package } from "lucide-react";
import { useState } from "react";
import StatusBadge from "./StatusBadge";
import ProgressBar from "./ProgressBar";

interface OrderVisualizerProps {
  orders: PicklistOrder[];
}

const OrderVisualizer = ({ orders }: OrderVisualizerProps) => {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {orders.map(order => {
        const isExpanded = expandedOrders.has(order.id);
        const statusCounts = getStatusCounts(order);
        
        return (
          <Card key={order.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  Order #{order.shopify_order_number}
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleOrderExpanded(order.id)}
                  className="h-8 w-8 p-0"
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </Button>
              </div>
              <div className="flex flex-col space-y-1 text-sm text-muted-foreground mt-1">
                <div className="flex items-center">
                  <User size={14} className="mr-1" />
                  <span>{order.customer_name}</span>
                </div>
                <div className="flex items-center">
                  <Calendar size={14} className="mr-1" />
                  <span>{formatDate(order.created_at)}</span>
                </div>
                <div className="flex items-center">
                  <Package size={14} className="mr-1" />
                  <span>{order.items.length} items</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pb-3 pt-0">
              <div className="flex flex-wrap gap-1.5 mb-4">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <StatusBadge 
                    key={status} 
                    status={status} 
                    count={count} 
                  />
                ))}
              </div>
              
              <ProgressBar order={order} />
              
              {isExpanded && (
                <div className="mt-4 space-y-4">
                  <div className="text-sm font-medium">Line Items:</div>
                  <div className="space-y-3">
                    {order.items.map(item => (
                      <div key={item.id} className="rounded border p-3 text-sm">
                        <div className="flex justify-between items-start">
                          <div className="font-medium">{item.title}</div>
                          <StatusBadge status={item.progress} showCount={false} />
                        </div>
                        <div className="mt-1 text-muted-foreground space-y-1">
                          <div>SKU: {item.sku || "No SKU"}</div>
                          <div>Quantity: {item.quantity}</div>
                          {item.quantity_required && (
                            <div>
                              Progress: {item.quantity_picked} of {item.quantity_required} {item.is_partial && "(Partial)"}
                            </div>
                          )}
                          {item.stock_quantity !== null && (
                            <div>
                              Stock: {item.stock_quantity} {item.bin_location && `(${item.bin_location})`}
                            </div>
                          )}
                          {item.notes && (
                            <div className="italic text-xs mt-2">
                              Notes: {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="pt-0">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-sm" 
                onClick={() => toggleOrderExpanded(order.id)}
              >
                {isExpanded ? "Hide Details" : "Show Details"}
                {isExpanded ? <ChevronUp size={14} className="ml-2" /> : <ChevronDown size={14} className="ml-2" />}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

export default OrderVisualizer;
