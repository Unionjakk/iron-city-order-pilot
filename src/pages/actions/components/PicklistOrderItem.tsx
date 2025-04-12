
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
  const [pickQuantity, setPickQuantity] = useState<number>(1);
  const [processing, setProcessing] = useState<boolean>(false);
  const [action, setAction] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [isPartial, setIsPartial] = useState<boolean>(false);

  const { 
    getStockColor,
    getLocationColor,
    getCostColor
  } = usePicklistItemActions(order, item.id, item.sku, refreshData);

  useEffect(() => {
    if (item.sku) {
      const loadPickedQuantity = async () => {
        const pickedQty = await fetchTotalPickedQuantityForSku(item.sku);
        setPickedQuantity(pickedQty);
      };
      
      loadPickedQuantity();
    }
  }, [item.sku]);

  const handleActionChange = (value: string) => {
    setAction(value);
    
    // Reset isPartial when action changes
    setIsPartial(false);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNote(e.target.value);
  };

  const handlePickQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    const maxQuantity = item.quantity || 1;
    setPickQuantity(isNaN(value) || value < 1 ? 1 : Math.min(value, maxQuantity));
    
    // Auto-set partial flag if pick quantity is less than required quantity
    setIsPartial(value < maxQuantity);
  };

  const handlePartialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPartial(e.target.checked);
  };

  const validatePartialPick = (): boolean => {
    const maxQuantity = item.quantity || 1;
    // If picking less than the total quantity, partial pick must be checked
    if (pickQuantity < maxQuantity && !isPartial) {
      toast({
        title: "Partial pick required",
        description: "Please check the 'Partial pick' box when picking less than the total quantity",
        variant: "destructive",
      });
      return false;
    }
    
    // If picking the full quantity, partial pick should be unchecked
    if (pickQuantity >= maxQuantity && isPartial) {
      // Auto-uncheck it instead of showing error
      setIsPartial(false);
    }
    
    return true;
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
    
    // For "Picked" action, validate partial pick settings
    if (action === "Picked" && !validatePartialPick()) {
      return;
    }
    
    setProcessing(true);
    
    try {
      // First delete any existing progress entries for this order/SKU combination
      await supabase
        .from('iron_city_order_progress')
        .delete()
        .eq('shopify_order_id', order.shopify_order_id)
        .eq('sku', item.sku);
      
      const requiredQuantity = item.quantity || 1;
      
      // Determine quantities based on the action
      const quantityPicked = action === "Picked" ? pickQuantity : 0;
      const remainingQuantity = requiredQuantity - quantityPicked;
      
      // Determine if this is a partial pick
      const needsPartialFlag = action === "Picked" && isPartial && remainingQuantity > 0;
      
      // Add notes about partial picking if applicable
      let finalNotes = note;
      if (needsPartialFlag && quantityPicked < requiredQuantity) {
        finalNotes = note 
          ? `${note} | Partial pick: ${quantityPicked} picked, ${remainingQuantity} to order` 
          : `Partial pick: ${quantityPicked} picked, ${remainingQuantity} to order`;
      }
      
      // Create the record with appropriate status and quantities
      const { error } = await supabase
        .from('iron_city_order_progress')
        .insert({
          shopify_order_id: order.shopify_order_id,
          shopify_order_number: order.shopify_order_number,
          sku: item.sku,
          progress: action,
          notes: finalNotes,
          quantity: requiredQuantity,
          quantity_required: requiredQuantity,
          quantity_picked: quantityPicked,
          is_partial: needsPartialFlag
        });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: needsPartialFlag
          ? `Item marked as partially picked (${quantityPicked} of ${requiredQuantity})`
          : `Item marked as ${action}`,
      });
      
      setNote("");
      setAction("");
      setIsPartial(false);
      
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

  return (
    <>
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
            {pickedQuantity ? <span className="text-amber-400"> ({pickedQuantity} picked total)</span> : null}
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
          <div className="space-y-2">
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
            </div>
            
            {action === "Picked" && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 text-sm">Pick quantity:</span>
                  <Input 
                    type="number"
                    min="1"
                    max={item.quantity || 1}
                    className="w-16 h-8 border-zinc-700 bg-zinc-800/50 text-zinc-300"
                    value={pickQuantity}
                    onChange={handlePickQuantityChange}
                    title="How many you are picking now"
                  />
                  <span className="text-zinc-400 text-sm">
                    (max: {item.quantity})
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`partial-${item.id}`}
                    checked={isPartial}
                    onChange={handlePartialChange}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-800/50 text-orange-500"
                  />
                  <label htmlFor={`partial-${item.id}`} className="text-zinc-300 text-sm">
                    Partial pick (need to order remaining)
                  </label>
                </div>
              </>
            )}
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
    </>
  );
};

export default PicklistOrderItem;
