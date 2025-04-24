
import React, { useState } from "react";
import { Clipboard, X, Check, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ResetProgressDialog from "./order-item/ResetProgressDialog";
import { useOrderItemActions } from "../hooks/useOrderItemActions";
import { supabase } from "@/integrations/supabase/client";

interface OrderedItemProps {
  id: string;
  shopify_order_id: string;
  shopify_order_number: string | null;
  sku: string;
  title: string;
  quantity: number;
  price: number | null;
  cost?: number | null;
  bin_location?: string | null;
  stock_quantity?: number | null;
  notes?: string | null;
  dealer_po_number?: string | null;
  hd_orderlinecombo?: string | null;
  onItemUpdated: () => void;
}

const OrderedOrderItem: React.FC<OrderedItemProps> = ({
  id,
  shopify_order_id,
  shopify_order_number,
  sku,
  title,
  quantity,
  price,
  cost,
  bin_location,
  stock_quantity,
  notes,
  dealer_po_number,
  hd_orderlinecombo,
  onItemUpdated
}) => {
  const [showResetDialog, setShowResetDialog] = React.useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [expectedArrival, setExpectedArrival] = useState<string | null>(null);
  const { toast } = useToast();
  const { handleCopySku } = useOrderItemActions(sku, { toast });

  // Fetch the expected arrival date from hd_combined
  React.useEffect(() => {
    if (hd_orderlinecombo) {
      const fetchExpectedArrival = async () => {
        try {
          const { data, error } = await supabase
            .from('hd_combined')
            .select('expected_arrival_dealership')
            .eq('hd_orderlinecombo', hd_orderlinecombo)
            .maybeSingle();

          if (error) throw error;
          if (data?.expected_arrival_dealership) {
            setExpectedArrival(data.expected_arrival_dealership);
          }
        } catch (error) {
          console.error("Error fetching expected arrival date:", error);
        }
      };

      fetchExpectedArrival();
    }
  }, [hd_orderlinecombo]);

  const handleMarkAsPicked = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('iron_city_order_progress')
        .update({
          progress: "Picked",
          notes: notes ? `${notes} | Marked as arrived & picked: ${new Date().toISOString().slice(0, 10)}` : `Marked as arrived & picked: ${new Date().toISOString().slice(0, 10)}`
        })
        .eq('shopify_line_item_id', shopify_order_id)
        .eq('sku', sku);
        
      if (error) throw new Error(error.message);
      
      toast({
        title: "Item Status Updated",
        description: "Item has been marked as 'Picked'",
      });
      
      onItemUpdated();
    } catch (error) {
      console.error("Error updating item status:", error);
      let errorMessage = "An unknown error occurred";
      
      // Fix: Handle the error object safely
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return "Unknown";
    }
  };

  return (
    <>
      <tr className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
        <td className="p-3">
          <div className="flex items-center space-x-2">
            <span 
              className="text-zinc-300 font-mono text-sm cursor-pointer hover:text-orange-400"
              onClick={handleCopySku}
            >
              {sku}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-zinc-400 hover:text-orange-400" 
              onClick={handleCopySku}
            >
              <Clipboard className="h-4 w-4" />
            </Button>
          </div>
        </td>
        <td className="p-3">
          <div className="max-w-md text-sm">
            <span className="text-zinc-300">{title}</span>
          </div>
        </td>
        <td className="p-3 text-center">
          <span className="font-medium text-orange-500">{quantity}</span>
        </td>
        <td className="p-3 text-center">
          {price ? (
            <span className="text-zinc-300">£{price.toFixed(2)}</span>
          ) : (
            <span className="text-zinc-500">--</span>
          )}
        </td>
        <td className="p-3 text-center">
          {stock_quantity !== null && stock_quantity !== undefined ? (
            <span className={`${stock_quantity > 0 ? 'text-green-500' : 'text-amber-500'}`}>
              {stock_quantity}
            </span>
          ) : (
            <span className="text-zinc-500">--</span>
          )}
        </td>
        <td className="p-3 text-center">
          {bin_location ? (
            <span className="text-orange-400">{bin_location}</span>
          ) : (
            <span className="text-zinc-500">--</span>
          )}
        </td>
        <td className="p-3 text-center">
          {cost ? (
            <span className="text-orange-400">£{cost.toFixed(2)}</span>
          ) : (
            <span className="text-zinc-500">--</span>
          )}
        </td>
        <td className="p-3">
          <div className="flex flex-col items-center">
            <span className="bg-green-500/20 text-green-400 px-2 py-1 text-xs rounded-full whitespace-nowrap mb-1">
              Ordered
            </span>
            {dealer_po_number && (
              <div className="text-xs text-green-400 mb-1">
                PO: {dealer_po_number}
              </div>
            )}
            {expectedArrival && (
              <div className="flex items-center text-xs text-amber-400">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(expectedArrival)}
              </div>
            )}
          </div>
        </td>
        <td className="p-3">
          <div className="flex flex-col justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-zinc-100 bg-green-600 hover:bg-green-700 hover:text-white border-none"
              onClick={handleMarkAsPicked}
              disabled={isUpdating}
            >
              <Check className="h-4 w-4 mr-1" />
              Arrived & Picked
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
              onClick={() => setShowResetDialog(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>

      <ResetProgressDialog
        isOpen={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        shopifyOrderId={shopify_order_id}
        sku={sku}
        onReset={onItemUpdated}
      />
    </>
  );
};

export default OrderedOrderItem;
