
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import ShopifyDetails from "./action-dialog/ShopifyDetails";
import PinnacleDetails from "./action-dialog/PinnacleDetails";
import ActionButtons from "./action-dialog/ActionButtons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PicklistItem {
  id: string;
  order_id: string;
  shopify_order_number: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  sku: string;
  title: string;
  quantity: number;
  price: number | null;
  price_ex_vat: number | null;
  pinnacle_stock_quantity: number | null;
  pinnacle_description: string | null;
  pinnacle_bin_location: string | null;
  pinnacle_cost: number | null;
  pinnacle_part_number: string | null;
}

interface ActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: PicklistItem;
  pinnacleData: any | null;
  refreshData: () => void;
}

const ActionDialog: React.FC<ActionDialogProps> = ({
  isOpen,
  onClose,
  item,
  pinnacleData,
  refreshData
}) => {
  const [notes, setNotes] = useState("");
  const [partialQuantity, setPartialQuantity] = useState<number>(1);
  const [totalPickedForOthers, setTotalPickedForOthers] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const effectivePinnacleData = pinnacleData || {
    corrected_sku: item.pinnacle_part_number || item.sku,
    description: item.pinnacle_description,
    bin_location: item.pinnacle_bin_location,
    stock_quantity: item.pinnacle_stock_quantity,
    cost: item.pinnacle_cost
  };

  useEffect(() => {
    const fetchTotalPicked = async () => {
      try {
        const { data, error } = await supabase
          .from('iron_city_order_progress')
          .select('quantity_picked')
          .eq('sku', item.sku)
          .not('quantity_picked', 'is', null);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const total = data.reduce((sum, record) => {
            return sum + (record.quantity_picked || 0);
          }, 0);
          
          setTotalPickedForOthers(total);
        }
      } catch (error) {
        console.error("Error fetching picked quantities:", error);
      }
    };
    
    if (isOpen) {
      fetchTotalPicked();
    }
  }, [isOpen, item.sku]);

  const getQuantityOptions = () => {
    const options = [];
    for (let i = 1; i < item.quantity; i++) {
      options.push(
        <SelectItem key={i} value={i.toString()}>
          {i}
        </SelectItem>
      );
    }
    return options;
  };

  const handlePickFullOrder = async () => {
    const stockQuantity = effectivePinnacleData.stock_quantity || 0;
    const isStockWarning = stockQuantity < item.quantity;
    
    if (isStockWarning) {
      if (!window.confirm(`Warning: Stock quantity (${stockQuantity}) is less than required quantity (${item.quantity}). Continue anyway?`)) {
        return;
      }
    }
    
    await processAction("Picked", item.quantity, false);
  };

  const handleOrderFullOrder = async () => {
    await processAction("To Order", 0, false);
  };

  const handlePartialPick = async () => {
    const stockQuantity = effectivePinnacleData.stock_quantity || 0;
    const isStockWarning = stockQuantity < partialQuantity;
    
    if (isStockWarning) {
      if (!window.confirm(`Warning: Stock quantity (${stockQuantity}) is less than partial quantity (${partialQuantity}). Continue anyway?`)) {
        return;
      }
    }
    
    await processAction("To Order", partialQuantity, true);
  };

  const processAction = async (progress: string, quantityPicked: number, isPartial: boolean) => {
    setIsProcessing(true);
    
    try {
      const shopifyOrderSkuCombo = `${item.shopify_order_number}${item.sku}`;
      
      const { error } = await supabase
        .from('iron_city_order_progress')
        .insert({
          shopify_order_id: item.order_id,
          shopify_order_number: item.shopify_order_number,
          sku: item.sku,
          notes: notes,
          progress: progress,
          quantity: item.quantity,
          quantity_required: item.quantity,
          quantity_picked: progress === "Picked" ? item.quantity : quantityPicked,
          is_partial: isPartial,
          shopify_ordersku_combo: shopifyOrderSkuCombo,
          pinnacle_sku_matched: effectivePinnacleData.corrected_sku || item.pinnacle_part_number || item.sku
        });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Item marked as ${progress}`,
      });
      
      onClose();
      refreshData();
    } catch (error: any) {
      console.error("Error updating progress:", error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return "N/A";
    return `£${value.toFixed(2)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-orange-400 text-xl mb-2">
            Progress this Shopify Order Line Item
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ShopifyDetails
            orderNumber={item.shopify_order_number}
            sku={item.sku}
            title={item.title}
            quantity={item.quantity}
            priceExVat={item.price_ex_vat}
          />
          
          <PinnacleDetails
            stockQuantity={effectivePinnacleData.stock_quantity}
            totalPickedForOthers={totalPickedForOthers}
            description={effectivePinnacleData.description}
            binLocation={effectivePinnacleData.bin_location}
            cost={effectivePinnacleData.cost}
          />
        </div>
        
        <div className="mt-4">
          <label htmlFor="notes" className="block text-zinc-400 mb-2">
            Notes:
          </label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this order..."
            className="h-24 bg-zinc-800/30 border-zinc-700 text-zinc-300"
          />
        </div>
        
        <ActionButtons
          quantity={item.quantity}
          partialQuantity={partialQuantity}
          isProcessing={isProcessing}
          onPartialQuantityChange={(value) => setPartialQuantity(parseInt(value))}
          onPickFullOrder={handlePickFullOrder}
          onOrderFullOrder={handleOrderFullOrder}
          onPartialPick={handlePartialPick}
        />
        
        <DialogFooter className="mt-6">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isProcessing}
            className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ActionDialog;
