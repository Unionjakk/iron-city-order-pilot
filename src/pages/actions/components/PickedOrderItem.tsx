
import React, { useState } from "react";
import { PicklistOrderItem, PicklistOrder } from "../types/picklistTypes";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PickedOrderItemProps {
  item: PicklistOrderItem;
  order: PicklistOrder;
  refreshData: () => void;
}

const PickedOrderItem = ({ item, order, refreshData }: PickedOrderItemProps) => {
  const { toast } = useToast();
  const [processing, setProcessing] = useState<boolean>(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState<boolean>(false);

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

  const handleClear = async () => {
    setProcessing(true);
    
    try {
      // Delete existing progress entry 
      await supabase
        .from('iron_city_order_progress')
        .delete()
        .eq('shopify_order_id', order.shopify_order_id)
        .eq('sku', item.sku);
      
      // Insert new progress entry with "To Pick" status
      const { error } = await supabase
        .from('iron_city_order_progress')
        .insert({
          shopify_order_id: order.shopify_order_id,
          shopify_order_number: order.shopify_order_number,
          sku: item.sku,
          progress: "To Pick",
          notes: item.notes || "",
          quantity: item.quantity || 1
        });
      
      if (error) throw error;
      
      toast({
        title: "Item cleared",
        description: "Item has been set back to To Pick status",
      });
      
      // Refresh data
      refreshData();
    } catch (error: any) {
      console.error("Error clearing item:", error);
      toast({
        title: "Clear failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setIsClearDialogOpen(false);
    }
  };

  return (
    <>
      <TableRow className="hover:bg-zinc-800/30 border-t border-zinc-800/30">
        <TableCell className="font-mono text-zinc-300 pr-1">{item.sku || "No SKU"}</TableCell>
        <TableCell className="pl-1 text-emerald-500 flex items-center">
          <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
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
          <div className="w-full border-zinc-700 bg-zinc-800/50 text-zinc-300 py-2 px-3 rounded-md text-sm">
            Picked
          </div>
        </TableCell>
        <TableCell>
          <Button 
            onClick={() => setIsClearDialogOpen(true)}
            disabled={processing}
            size="sm"
            variant="destructive"
            className="w-full"
          >
            {processing ? "Processing..." : "Clear"}
          </Button>
          
          <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
            <AlertDialogContent className="bg-zinc-900 border-zinc-700">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-orange-400">Are you sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-300">
                  This will set the product back to "To Pick"
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel 
                  className="bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                >
                  No
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleClear}
                  className="bg-orange-500 text-white hover:bg-orange-600"
                >
                  Yes
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TableCell>
      </TableRow>
      
      {/* Notes field under each item - now read-only */}
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

export default PickedOrderItem;
