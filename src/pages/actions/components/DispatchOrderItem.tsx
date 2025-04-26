
import React from "react";
import { PicklistOrderItem, PicklistOrder } from "../types/picklistTypes";
import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

interface DispatchOrderItemProps {
  item: PicklistOrderItem;
  order: PicklistOrder;
  refreshData: () => void;
}

const DispatchOrderItem = ({ item, order }: DispatchOrderItemProps) => {
  return (
    <>
      <TableRow className="hover:bg-zinc-800/30 border-t border-zinc-800/30">
        <TableCell className="font-mono text-zinc-300 pr-1">{item.sku || "No SKU"}</TableCell>
        <TableCell className="pl-1 text-emerald-500 flex items-center">
          <Package className="h-4 w-4 mr-2 text-emerald-500" />
          {item.title}
        </TableCell>
        <TableCell className="text-center">
          {item.quantity}
        </TableCell>
        <TableCell className="text-center">
          {item.price ? `£${item.price.toFixed(2)}` : "N/A"}
        </TableCell>
        <TableCell className="text-center text-zinc-300">
          {item.stock_quantity || 0}
        </TableCell>
        <TableCell className="text-zinc-300">
          {item.bin_location || "N/A"}
        </TableCell>
        <TableCell className="text-zinc-300">
          {item.cost ? `£${item.cost.toFixed(2)}` : "N/A"}
        </TableCell>
        <TableCell>
          <Button 
            disabled
            size="sm"
            className="w-full bg-zinc-700 text-zinc-400 cursor-not-allowed"
          >
            Dispatch
          </Button>
        </TableCell>
      </TableRow>
      
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
