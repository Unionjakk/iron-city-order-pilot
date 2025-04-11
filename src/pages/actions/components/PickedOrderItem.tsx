
import React, { useState } from "react";
import { PicklistOrderItem, PicklistOrder } from "../types/picklistTypes";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CheckCircle, PackageCheck, TruckIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PickedOrderItemProps {
  item: PicklistOrderItem;
  order: PicklistOrder;
  refreshData: () => void;
}

const PickedOrderItem = ({ item, order, refreshData }: PickedOrderItemProps) => {
  const { toast } = useToast();
  const [note, setNote] = useState<string>(item.notes || "");
  const [action, setAction] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);

  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNote(e.target.value);
  };

  const handleActionChange = (value: string) => {
    setAction(value);
  };

  const handleSubmit = async () => {
    if (!action) {
      toast({
        title: "Action required",
        description: "Please select an action before submitting",
        variant: "destructive",
      });
      return;
    }
    
    setProcessing(true);
    
    try {
      // First delete existing progress entry 
      await supabase
        .from('iron_city_order_progress')
        .delete()
        .eq('shopify_order_id', order.shopify_order_id)
        .eq('sku', item.sku);
      
      // Insert new progress entry
      const { error } = await supabase
        .from('iron_city_order_progress')
        .insert({
          shopify_order_id: order.shopify_order_id,
          shopify_order_number: order.shopify_order_number,
          sku: item.sku,
          progress: action,
          notes: note
        });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Item marked as ${action}`,
      });
      
      // Clear form fields
      setNote("");
      setAction("");
      
      // Refresh data
      refreshData();
    } catch (error: any) {
      console.error("Error updating progress:", error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Utility functions for styling
  const getStockColor = (inStock: boolean, quantity: number | null, orderQuantity: number): string => {
    if (!inStock || quantity === null || quantity === 0) return "text-green-800";
    if (quantity < orderQuantity) return "text-green-600";
    return "text-green-500";
  };

  const getLocationColor = (inStock: boolean): string => {
    return inStock ? "text-green-500" : "text-green-800";
  };

  const getCostColor = (inStock: boolean, cost: number | null): string => {
    if (!inStock || cost === null) return "text-green-800";
    return "text-green-500";
  };

  return (
    <React.Fragment>
      <TableRow className="hover:bg-zinc-800/30 border-t border-zinc-800/30">
        <TableCell className="font-mono text-zinc-300 pr-1">{item.sku || "No SKU"}</TableCell>
        <TableCell className="pl-1 text-emerald-500 flex items-center">
          <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
          {item.title}
        </TableCell>
        <TableCell className="text-center">{item.quantity}</TableCell>
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
          <Select 
            value={action} 
            onValueChange={handleActionChange}
          >
            <SelectTrigger className="w-full border-zinc-700 bg-zinc-800/50 text-zinc-300">
              <SelectValue placeholder="Next action..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="To Order">To Order</SelectItem>
              <SelectItem value="To Dispatch">To Dispatch</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <Button 
            onClick={handleSubmit}
            disabled={!action || processing}
            size="sm"
            className="button-primary w-full"
          >
            {processing ? "Saving..." : "Process"}
          </Button>
        </TableCell>
      </TableRow>
      
      {/* Notes field under each item */}
      <TableRow className="border-none">
        <TableCell colSpan={9} className="pt-0 pb-2">
          <Input
            placeholder="Add notes here..." 
            className="h-8 border-zinc-700 bg-zinc-800/50 text-zinc-300 w-full"
            value={note}
            onChange={handleNoteChange}
          />
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

export default PickedOrderItem;
