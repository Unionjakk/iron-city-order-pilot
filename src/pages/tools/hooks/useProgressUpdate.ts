
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProgressUpdatePayload } from "../types/dragAndDropTypes";

interface UseProgressUpdateProps {
  refreshData: () => void;
}

export const useProgressUpdate = ({ refreshData }: UseProgressUpdateProps) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  
  const updateItemProgress = async (payload: ProgressUpdatePayload) => {
    if (!payload.shopifyOrderId || !payload.sku) {
      toast({
        title: "Update failed",
        description: "Missing required item information",
        variant: "destructive",
      });
      return;
    }
    
    setIsUpdating(true);
    
    try {
      console.log(`Updating item progress: ${JSON.stringify(payload)}`);
      
      // Special case for To Dispatch - need to update all items in the order
      if (payload.progress === "To Dispatch") {
        // First delete any existing progress entries for this order - Updated to use shopify_line_item_id
        await supabase
          .from('iron_city_order_progress')
          .delete()
          .eq('shopify_line_item_id', payload.shopifyOrderId);
        
        // Get all line items for this order to update them
        const { data: orderData } = await supabase
          .from('shopify_orders')
          .select('id, shopify_order_number')
          .eq('shopify_order_id', payload.shopifyOrderId)
          .single();
        
        if (!orderData) {
          throw new Error("Order not found");
        }
        
        // Get line items for this order
        const { data: lineItems, error: lineItemsError } = await supabase
          .from('shopify_order_items')
          .select('sku, shopify_line_item_id')
          .eq('order_id', orderData.id);
        
        if (lineItemsError) throw lineItemsError;
        
        // Insert progress entries for all line items - Updated to use shopify_line_item_id
        if (lineItems && lineItems.length > 0) {
          for (const item of lineItems) {
            const { error: insertError } = await supabase
              .from('iron_city_order_progress')
              .insert({
                shopify_line_item_id: payload.shopifyOrderId,
                shopify_order_number: orderData.shopify_order_number,
                sku: item.sku,
                progress: payload.progress,
                notes: payload.notes || null
              });
              
            if (insertError) throw insertError;
          }
        }
        
        toast({
          title: "Order updated",
          description: `All items in order moved to ${payload.progress}`,
        });
      } else {
        // Regular item update
        // First delete any existing progress entry for this item - Updated to use shopify_line_item_id
        await supabase
          .from('iron_city_order_progress')
          .delete()
          .eq('shopify_line_item_id', payload.shopifyOrderId)
          .eq('sku', payload.sku);
        
        // Get order number
        const { data: orderData } = await supabase
          .from('shopify_orders')
          .select('shopify_order_number')
          .eq('shopify_order_id', payload.shopifyOrderId)
          .single();
        
        if (!orderData) {
          throw new Error("Order not found");
        }
        
        // Insert new progress entry - Updated to use shopify_line_item_id
        const { error: insertError } = await supabase
          .from('iron_city_order_progress')
          .insert({
            shopify_line_item_id: payload.shopifyOrderId,
            shopify_order_number: orderData.shopify_order_number,
            sku: payload.sku,
            progress: payload.progress,
            notes: payload.notes,
            dealer_po_number: payload.dealer_po_number,
            quantity_picked: payload.quantityPicked,
            is_partial: payload.isPartial
          });
        
        if (insertError) throw insertError;
        
        toast({
          title: "Item updated",
          description: `Item moved to ${payload.progress}`,
        });
      }
      
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
      setIsUpdating(false);
    }
  };
  
  return {
    updateItemProgress,
    isUpdating
  };
};
