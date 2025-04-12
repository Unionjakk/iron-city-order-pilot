
import React from "react";
import { format } from "date-fns";
import { ExternalLink, Mail, CheckCircle } from "lucide-react";
import { PicklistOrder } from "../types/picklistTypes";
import { TableCell, TableRow } from "@/components/ui/table";
import PickedOrderItem from "./PickedOrderItem";

interface PickedOrderComponentProps {
  order: PicklistOrder;
  refreshData: () => void;
}

const PickedOrderComponent = ({ order, refreshData }: PickedOrderComponentProps) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy");
    } catch (e) {
      return "Invalid date";
    }
  };
  
  const getShopifyOrderUrl = (orderId: string) => {
    return `https://admin.shopify.com/store/opus-harley-davidson/orders/${orderId}`;
  };

  // Check if all items in the order are fully picked
  const isCompleteOrder = order.items.length > 0 && order.items.every(item => {
    const quantityRequired = item.quantity_required || item.quantity || 1;
    const quantityPicked = item.quantity_picked || 0;
    return quantityPicked >= quantityRequired;
  });

  // Calculate overall picking progress
  const totalRequiredQuantity = order.items.reduce((sum, item) => sum + (item.quantity_required || item.quantity || 1), 0);
  const totalPickedQuantity = order.items.reduce((sum, item) => sum + (item.quantity_picked || 0), 0);
  const pickingProgress = Math.round((totalPickedQuantity / totalRequiredQuantity) * 100);

  return (
    <>
      <TableRow key={`order-${order.id}`} className="bg-zinc-800/20">
        <TableCell colSpan={9} className="py-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="flex items-center">
              <span className="font-semibold text-orange-400">Order:</span>
              <a 
                href={getShopifyOrderUrl(order.shopify_order_id)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 flex items-center link-styled"
              >
                {order.shopify_order_number || order.shopify_order_id.substring(0, 8)}
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
              <span className="ml-2 flex items-center text-emerald-500">
                <CheckCircle className="h-4 w-4 mr-1" />
                Picked {!isCompleteOrder && <span className="text-amber-400 ml-1">({pickingProgress}%)</span>}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div>
                <span className="text-zinc-400 mr-2">Date:</span>
                <span className="text-zinc-300">{formatDate(order.created_at)}</span>
              </div>
              <div>
                <span className="text-zinc-400 mr-2">Customer:</span>
                <span className="text-zinc-300">{order.customer_name}</span>
              </div>
              <div className="flex items-center">
                <Mail className="mr-1 h-3 w-3 text-zinc-400" />
                <a href={`mailto:${order.customer_email}`} className="text-zinc-300 hover:text-orange-400">
                  {order.customer_email || "No email"}
                </a>
              </div>
            </div>
          </div>
        </TableCell>
      </TableRow>
      
      {order.items.map((item) => (
        <PickedOrderItem 
          key={`item-${item.id}`} 
          item={item} 
          order={order} 
          refreshData={refreshData}
          isCompleteOrder={isCompleteOrder}
        />
      ))}
    </>
  );
};

export default PickedOrderComponent;
