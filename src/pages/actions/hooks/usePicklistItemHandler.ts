
import { useState } from "react";
import { PicklistOrder } from "../types/picklistTypes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const usePicklistItemHandler = (
  order: PicklistOrder,
  sku: string,
  quantity: number,
  refreshData: () => void
) => {
  const { toast } = useToast();
  const [pickQuantity, setPickQuantity] = useState<number>(1);
  const [processing, setProcessing] = useState<boolean>(false);
  const [action, setAction] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const handleActionChange = (value: string) => {
    setAction(value);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNote(e.target.value);
  };

  const handlePickQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    const maxQuantity = quantity || 1;
    setPickQuantity(isNaN(value) || value < 1 ? 1 : Math.min(value, maxQuantity));
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
      await supabase
        .from('iron_city_order_progress')
        .delete()
        .eq('shopify_order_id', order.shopify_order_id)
        .eq('sku', sku);
      
      const requiredQuantity = quantity || 1;
      
      const quantityPicked = action === "Picked" ? pickQuantity : 0;
      
      const { error } = await supabase
        .from('iron_city_order_progress')
        .insert({
          shopify_order_id: order.shopify_order_id,
          shopify_order_number: order.shopify_order_number,
          sku: sku,
          progress: action,
          notes: note,
          quantity: requiredQuantity,
          quantity_required: requiredQuantity,
          quantity_picked: quantityPicked
        });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: action === "Picked" 
          ? `Item marked as ${action} with ${pickQuantity} of ${requiredQuantity} picked`
          : `Item marked as ${action}`,
      });
      
      setNote("");
      setAction("");
      
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

  return {
    action,
    note,
    processing,
    pickQuantity,
    handleActionChange,
    handleNoteChange,
    handlePickQuantityChange,
    handleSubmit
  };
};
