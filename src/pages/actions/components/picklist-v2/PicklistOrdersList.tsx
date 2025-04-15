
import { useState } from "react";
import { ExternalLink, Mail } from "lucide-react";
import { format } from "date-fns";
import PicklistOrderItem from "./PicklistOrderItem";

// Define interfaces for our data
interface PicklistItem {
  id: string;
  order_id: string;
  shopify_order_number: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  sku: string;
  title: string;
  quantity: number;
  price: number | null;
  price_ex_vat: number | null;
  pinnacle_stock_quantity: number | null;
  pinnacle_description: string | null;
  pinnacle_bin_location: string | null;
  pinnacle_cost: number | null;
  pinnacle_part_number: string | null;
}

// Group items by order
interface PicklistOrder {
  shopify_order_number: string;
  order_id: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  items: PicklistItem[];
}

interface PicklistOrdersListProps {
  orders: PicklistOrder[];
  refreshData: () => void;
}

const PicklistOrdersList: React.FC<PicklistOrdersListProps> = ({ orders, refreshData }) => {
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
    <div className="divide-y divide-zinc-800">
      {orders.map((order) => (
        <div key={order.shopify_order_number} className="py-4 px-4">
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <div className="flex items-center">
                <span className="font-semibold text-orange-400">Order:</span>
                <a 
                  href={getShopifyOrderUrl(order.order_id)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 flex items-center link-styled"
                >
                  {order.shopify_order_number}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
                <div>
                  <span className="text-orange-400 mr-2">Date:</span>
                  <span className="text-zinc-300">{formatDate(order.created_at)}</span>
                </div>
                <div>
                  <span className="text-orange-400 mr-2">Customer:</span>
                  <span className="text-zinc-300">{order.customer_name}</span>
                </div>
                {order.customer_email && (
                  <div className="flex items-center">
                    <Mail className="mr-1 h-3 w-3 text-orange-400" />
                    <a href={`mailto:${order.customer_email}`} className="text-zinc-300 hover:text-orange-400">
                      {order.customer_email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/50 text-left">
                  <th className="pb-2 font-medium text-zinc-400">SKU</th>
                  <th className="pb-2 font-medium text-zinc-400">Item</th>
                  <th className="pb-2 font-medium text-zinc-400 text-center">Qty</th>
                  <th className="pb-2 font-medium text-zinc-400 text-center">Price</th>
                  <th className="pb-2 font-medium text-green-500 text-center">Stock</th>
                  <th className="pb-2 font-medium text-green-500 text-center">Location</th>
                  <th className="pb-2 font-medium text-green-500 text-center">Cost</th>
                  <th className="pb-2 font-medium text-zinc-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <PicklistOrderItem 
                    key={`${order.shopify_order_number}-${item.sku}`}
                    item={item}
                    refreshData={refreshData}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PicklistOrdersList;
