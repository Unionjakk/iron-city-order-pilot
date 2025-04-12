import React, { useState } from "react";
import { PicklistOrderItem, PicklistOrder } from "../types/picklistTypes";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Package, SplitIcon } from "lucide-react";
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

interface DispatchOrderItemProps {
  item: PicklistOrderItem;
  order: PicklistOrder;
  refreshData: () => void;
}

const DispatchOrderItem = ({ item, order, refreshData }: DispatchOrderItemProps) => {
  const { toast } = useToast();
  const [processing, setProcessing] = useState<boolean>(false);
  const [isDispatchDialogOpen, setIsDispatchDialogOpen] = useState<boolean>(false);

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

  const handleDispatch = async () => {
    setProcessing(true);
    
    try {
      // Update progress entry to "Dispatched" status
      const { error } = await supabase
        .from('iron_city_order_progress')
        .update({
          progress: "Dispatched",
          notes: (item.notes ? item.notes + " | " : "") + "Marked as dispatched: " + new Date().toISOString().slice(0, 10)
        })
        .eq('shopify_order_id', order.shopify_order_id)
        .eq('sku', item.sku);
      
      if (error) throw error;
      
      toast({
        title: "Item dispatched",
        description: "Item has been marked as dispatched",
      });
      
      // Refresh data
      refreshData();
    } catch (error: any) {
      console.error("Error marking for dispatch:", error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setIsDispatchDialogOpen(false);
    }
  };

  // Check if item is fully picked
  const isFullyPicked = (item.quantity_picked || 0) >= (item.quantity_required || item.quantity || 1);
  
  // Flag to show if this is a partial pick
  const isPartialPick = item.is_partial === true;

  return (
    <>
      <TableRow className="hover:bg-zinc-800/30 border-t border-zinc-800/30">
        <TableCell className="font-mono text-zinc-300 pr-1">{item.sku || "No SKU"}</TableCell>
        <TableCell className="pl-1 text-emerald-500 flex items-center">
          {isPartialPick ? (
            <SplitIcon className="h-4 w-4 mr-2 text-amber-500" aria-label="Partial pick" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
          )}
          {item.title}
        </TableCell>
        <TableCell className="text-center">
          {item.quantity}
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
          <Button 
            onClick={() => setIsDispatchDialogOpen(true)}
            disabled={processing}
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {processing ? "Processing..." : "Dispatch"}
          </Button>
          
          <AlertDialog open={isDispatchDialogOpen} onOpenChange={setIsDispatchDialogOpen}>
            <AlertDialogContent className="bg-zinc-900 border-zinc-700">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-orange-400">Dispatch Item?</AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-300">
                  Are you sure you want to mark this item as dispatched?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel 
                  className="bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDispatch}
                  className="bg-orange-500 text-white hover:bg-orange-600"
                >
                  Dispatch
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

export default DispatchOrderItem;
