
import React, { useState, useEffect } from "react";
import { PicklistOrderItem as PicklistOrderItemType, PicklistOrder } from "../types/picklistTypes";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePicklistItemActions } from "../hooks/usePicklistItemActions";
import { fetchTotalPickedQuantityForSku } from "../services/pickedDataService";

interface PicklistOrderItemProps {
  item: PicklistOrderItemType;
  order: PicklistOrder;
  refreshData: () => void;
}

const PicklistOrderItem = ({ item, order, refreshData }: PicklistOrderItemProps) => {
  const { toast } = useToast();
  const [pickedQuantity, setPickedQuantity] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  
  const { 
    note, 
    action, 
    processing,
    handleNoteChange,
    handleActionChange,
    handleSubmit: originalHandleSubmit,
    getStockColor,
    getLocationColor,
    getCostColor
  } = usePicklistItemActions(order, item.id, item.sku, refreshData);

  // Load picked quantity for this SKU
  useEffect(() => {
    if (item.sku) {
      const loadPickedQuantity = async () => {
        const pickedQty = await fetchTotalPickedQuantityForSku(item.sku);
        setPickedQuantity(pickedQty);
      };
      
      loadPickedQuantity();
    }
  }, [item.sku]);

  // Handle quantity change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setQuantity(isNaN(value) || value < 1 ? 1 : value);
  };

  // Wrap the original submit function to include quantity
  const handleSubmit = async () => {
    try {
      // First delete any existing progress entries for this order/SKU combination
      await supabase
        .from('iron_city_order_progress')
        .delete()
        .eq('shopify_order_id', order.shopify_order_id)
        .eq('sku', item.sku);
      
      // Insert new progress entry with quantity
      const { error } = await supabase
        .from('iron_city_order_progress')
        .insert({
          shopify_order_id: order.shopify_order_id,
          shopify_order_number: order.shopify_order_number,
          sku: item.sku,
          progress: action,
          notes: note,
          quantity: quantity
        });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Item marked as ${action} with quantity ${quantity}`,
      });
      
      // Refresh data
      refreshData();
    } catch (error: any) {
      console.error("Error updating progress:", error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <React.Fragment>
      <TableRow className="hover:bg-zinc-800/30 border-t border-zinc-800/30">
        <TableCell className="font-mono text-zinc-300 pr-1">{item.sku || "No SKU"}</TableCell>
        <TableCell className="pl-1 text-orange-400">{item.title}</TableCell>
        <TableCell className="text-center">{item.quantity}</TableCell>
        <TableCell className="text-center">
          {item.price ? `£${item.price.toFixed(2)}` : "N/A"}
        </TableCell>
        <TableCell className="text-center">
          <span className={getStockColor(item.in_stock, item.stock_quantity, item.quantity)}>
            {item.stock_quantity || 0}
            {pickedQuantity ? <span className="text-amber-400"> ({pickedQuantity} picked)</span> : null}
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
          <div className="flex items-center gap-2">
            <Select 
              value={action} 
              onValueChange={handleActionChange}
            >
              <SelectTrigger className="w-full border-zinc-700 bg-zinc-800/50 text-zinc-300">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Picked">Picked</SelectItem>
                <SelectItem value="To Order">To Order</SelectItem>
              </SelectContent>
            </Select>
            <Input 
              type="number"
              min="1"
              className="w-16 h-10 border-zinc-700 bg-zinc-800/50 text-zinc-300"
              value={quantity}
              onChange={handleQuantityChange}
            />
          </div>
        </TableCell>
        <TableCell>
          <Button 
            onClick={handleSubmit}
            disabled={!action || processing}
            size="sm"
            className="button-primary w-full"
          >
            {processing ? "Saving..." : "Save"}
          </Button>
        </TableCell>
      </TableRow>
      
      {/* Notes field moved under each item */}
      <TableRow className="border-none">
        <TableCell colSpan={9} className="pt-0 pb-2">
          <Input
            placeholder="Add notes here..." 
            className="h-8 border-zinc-700 bg-zinc-800/50 text-zinc-300 w-full"
            value={note}
            onChange={(e) => handleNoteChange(e.target.value)}
          />
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

export default PicklistOrderItem;
