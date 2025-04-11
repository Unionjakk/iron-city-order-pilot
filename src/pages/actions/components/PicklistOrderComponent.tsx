
import React from "react";
import { format } from "date-fns";
import { ExternalLink, Mail } from "lucide-react";
import { PicklistOrder } from "../types/picklistTypes";
import { TableCell, TableRow } from "@/components/ui/table";
import PicklistOrderItem from "./PicklistOrderItem";

interface PicklistOrderComponentProps {
  order: PicklistOrder;
  refreshData: () => void;
}

const PicklistOrderComponent = ({ order, refreshData }: PicklistOrderComponentProps) => {
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

  return (
    <React.Fragment>
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
        <PicklistOrderItem 
          key={`item-${item.id}`} 
          item={item} 
          order={order} 
          refreshData={refreshData} 
        />
      ))}
    </React.Fragment>
  );
};

export default PicklistOrderComponent;
