import React from "react";
import { format } from "date-fns";
import { ExternalLink, Mail, CheckCircle, TruckIcon, XCircle } from "lucide-react";
import { PicklistOrder } from "../types/picklistTypes";
import { TableCell, TableRow } from "@/components/ui/table";
import PickedOrderItem from "./PickedOrderItem";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PickedOrderComponentProps {
  order: PicklistOrder;
  refreshData: () => void;
}

const PickedOrderComponent = ({ order, refreshData }: PickedOrderComponentProps) => {
  const { toast } = useToast();
  const [processing, setProcessing] = React.useState(false);
  
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

  // Use a proper calculation to determine if order is complete
  const isCompleteOrder = React.useMemo(() => {
    return order.items.length > 0 && order.items.every(item => {
      const quantityRequired = item.quantity_required || item.quantity || 1;
      const quantityPicked = item.quantity_picked || 0;
      return quantityPicked >= quantityRequired;
    });
  }, [order.items]);

  // Calculate overall picking progress
  const { totalRequiredQuantity, totalPickedQuantity, pickingProgress } = React.useMemo(() => {
    const totalRequired = order.items.reduce((sum, item) => sum + (item.quantity_required || item.quantity || 1), 0);
    const totalPicked = order.items.reduce((sum, item) => sum + (item.quantity_picked || 0), 0);
    return {
      totalRequiredQuantity: totalRequired,
      totalPickedQuantity: totalPicked,
      pickingProgress: Math.round((totalPicked / totalRequired) * 100)
    };
  }, [order.items]);

  // Handle moving all items in the order to "To Dispatch" status
  const handleMoveToDispatch = async () => {
    if (!isCompleteOrder) return;
    
    setProcessing(true);
    try {
      // Update all items in this order to "To Dispatch" status
      const timestamp = new Date().toISOString().slice(0, 10);
      const note = `Order marked ready for dispatch: ${timestamp}`;
      
      // First get the current items to retrieve their notes
      const { data: currentItems, error: fetchError } = await supabase
        .from('iron_city_order_progress')
        .select('id, notes')
        .eq('shopify_line_item_id', order.shopify_order_id)
        .eq('progress', 'Picked');
        
      if (fetchError) throw fetchError;
      
      // Now update each item, properly appending notes
      for (const item of currentItems || []) {
        const updatedNote = item.notes 
          ? `${item.notes} | ${note}` 
          : note;
          
        const { error: updateError } = await supabase
          .from('iron_city_order_progress')
          .update({
            progress: "To Dispatch",
            notes: updatedNote
          })
          .eq('id', item.id);
          
        if (updateError) throw updateError;
      }
      
      toast({
        title: "Order moved to dispatch",
        description: `Order ${order.shopify_order_number || order.shopify_order_id} has been marked for dispatch`,
      });
      
      refreshData();
    } catch (error: any) {
      console.error("Error moving order to dispatch:", error);
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
      <TableRow key={`order-${order.id}`} className="bg-zinc-800/20">
        <TableCell colSpan={9} className="py-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="flex items-center">
              <span className="font-semibold text-orange-400">Order:</span>
              <a 
                href={getShopifyOrderUrl(order.shopify_order_id)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 flex items-center link-styled"
              >
                {order.shopify_order_number || order.shopify_order_id.substring(0, 8)}
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
              
              {isCompleteOrder ? (
                <span className="ml-2 flex items-center text-emerald-500">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Complete
                </span>
              ) : (
                <span className="ml-2 flex items-center text-amber-400">
                  <XCircle className="h-4 w-4 mr-1" />
                  Incomplete ({pickingProgress}%)
                </span>
              )}
              
              {isCompleteOrder && (
                <Button 
                  onClick={handleMoveToDispatch}
                  disabled={processing}
                  size="sm"
                  className="ml-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <TruckIcon className="mr-1 h-4 w-4" />
                  Complete - Ready for Dispatch
                </Button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div>
                <span className="text-zinc-400 mr-2">Date:</span>
                <span className="text-zinc-300">{formatDate(order.created_at)}</span>
              </div>
              <div>
                <span className="text-zinc-400 mr-2">Customer:</span>
                <span className="text-zinc-300">{order.customer_name}</span>
              </div>
              <div className="flex items-center">
                <Mail className="mr-1 h-3 w-3 text-zinc-400" />
                <a href={`mailto:${order.customer_email}`} className="text-zinc-300 hover:text-orange-400">
                  {order.customer_email || "No email"}
                </a>
              </div>
            </div>
          </div>
        </TableCell>
      </TableRow>
      
      {order.items.map((item) => (
        <PickedOrderItem 
          key={`item-${item.id}`} 
          item={item} 
          order={order} 
          refreshData={refreshData}
          isCompleteOrder={isCompleteOrder}
        />
      ))}
    </>
  );
};

export default PickedOrderComponent;
