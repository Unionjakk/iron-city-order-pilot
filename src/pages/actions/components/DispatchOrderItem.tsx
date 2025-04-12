
import React, { useState } from "react";
import { PicklistOrderItem, PicklistOrder } from "../types/picklistTypes";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, ExternalLink, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DispatchOrderItemProps {
  item: PicklistOrderItem;
  order: PicklistOrder;
  refreshData: () => void;
}

const DispatchOrderItem = ({ item, order, refreshData }: DispatchOrderItemProps) => {
  const { toast } = useToast();
  const [processing, setProcessing] = useState<boolean>(false);

  // Utility functions for styling
  const getStockColor = (inStock: boolean, quantity: number | null, orderQuantity: number): string => {
    if (!inStock || quantity === null || quantity === 0) return "text-blue-800";
    if (quantity < orderQuantity) return "text-blue-600";
    return "text-blue-500";
  };

  const getLocationColor = (inStock: boolean): string => {
    return inStock ? "text-blue-500" : "text-blue-800";
  };

  const getCostColor = (inStock: boolean, cost: number | null): string => {
    if (!inStock || cost === null) return "text-blue-800";
    return "text-blue-500";
  };

  const getShopifyOrderUrl = (orderId: string) => {
    return `https://admin.shopify.com/store/opus-harley-davidson/orders/${orderId}`;
  };

  return (
    <>
      <TableRow className="hover:bg-zinc-800/30 border-t border-zinc-800/30">
        <TableCell className="font-mono text-zinc-300 pr-1">{item.sku || "No SKU"}</TableCell>
        <TableCell className="pl-1 text-blue-500 flex items-center">
          <CheckCircle className="h-4 w-4 mr-2 text-blue-500" />
          {item.title}
        </TableCell>
        <TableCell className="text-center">
          {item.quantity}
          {item.pickedQuantity && item.pickedQuantity !== item.quantity && 
            <span className="ml-1 text-amber-400">({item.pickedQuantity} picked)</span>
          }
        </TableCell>
        <TableCell className="text-center">
          {item.price ? `£${item.price.toFixed(2)}` : "N/A"}
        </TableCell>
        <TableCell className="text-center">
          <span className={getStockColor(item.in_stock, item.stock_quantity, item.quantity)}>
            {item.stock_quantity || 0}
          </span>
        </TableCell>
        <TableCell>
          <span className={getLocationColor(item.in_stock)}>
            {item.bin_location || "N/A"}
          </span>
        </TableCell>
        <TableCell>
          <span className={getCostColor(item.in_stock, item.cost)}>
            {item.in_stock && item.cost ? `£${item.cost.toFixed(2)}` : "N/A"}
          </span>
        </TableCell>
        <TableCell>
          <div className="w-full border-zinc-700 bg-zinc-800/50 text-blue-300 py-2 px-3 rounded-md text-sm">
            Ready For Dispatch
          </div>
        </TableCell>
        <TableCell>
          <Button 
            onClick={() => window.open(getShopifyOrderUrl(order.shopify_order_id), '_blank')}
            size="sm"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ExternalLink className="mr-1 h-4 w-4" />
            Mark Fulfilled
          </Button>
        </TableCell>
      </TableRow>
      
      {/* Notes field under each item - read-only */}
      <TableRow className="border-none">
        <TableCell colSpan={9} className="pt-0 pb-2">
          <Input
            placeholder="No notes" 
            className="h-8 border-zinc-700 bg-zinc-800/50 text-zinc-300 w-full cursor-not-allowed opacity-70"
            value={item.notes || ""}
            readOnly
          />
        </TableCell>
      </TableRow>
    </>
  );
};

export default DispatchOrderItem;
