
import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ShopifyLogo from "./ShopifyLogo";
import PinnacleLogo from "./PinnacleLogo";

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

  // Get the effective data - either from pinnacleData (if user manually selected) or from the item
  const effectivePinnacleData = pinnacleData || {
    corrected_sku: item.pinnacle_part_number || item.sku,
    description: item.pinnacle_description,
    bin_location: item.pinnacle_bin_location,
    stock_quantity: item.pinnacle_stock_quantity,
    cost: item.pinnacle_cost
  };

  // Fetch total picked quantity for this SKU across all orders
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
          // Sum up all quantity_picked values
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

  // Generate dropdown options for partial pick
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

  // Handle Pick Full Order action
  const handlePickFullOrder = async () => {
    // Check if there's enough stock
    const stockQuantity = effectivePinnacleData.stock_quantity || 0;
    const isStockWarning = stockQuantity < item.quantity;
    
    if (isStockWarning) {
      // Confirm with user
      if (!window.confirm(`Warning: Stock quantity (${stockQuantity}) is less than required quantity (${item.quantity}). Continue anyway?`)) {
        return;
      }
    }
    
    await processAction("Picked", item.quantity, false);
  };

  // Handle Order Full Order action
  const handleOrderFullOrder = async () => {
    await processAction("To Order", 0, false);
  };

  // Handle Partial Pick action
  const handlePartialPick = async () => {
    // Check if there's enough stock
    const stockQuantity = effectivePinnacleData.stock_quantity || 0;
    const isStockWarning = stockQuantity < partialQuantity;
    
    if (isStockWarning) {
      // Confirm with user
      if (!window.confirm(`Warning: Stock quantity (${stockQuantity}) is less than partial quantity (${partialQuantity}). Continue anyway?`)) {
        return;
      }
    }
    
    await processAction("To Order", partialQuantity, true);
  };

  // Common function to process all actions
  const processAction = async (progress: string, quantityPicked: number, isPartial: boolean) => {
    setIsProcessing(true);
    
    try {
      // Create shopify_ordersku_combo
      const shopifyOrderSkuCombo = `${item.shopify_order_number}${item.sku}`;
      
      // Insert new progress entry
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
      
      // Close dialog and refresh data
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

  // Format currency
  const formatCurrency = (value: number | null) => {
    if (value === null) return "N/A";
    return `£${value.toFixed(2)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-orange-400 text-xl mb-2">Progress this Shopify Order Line Item</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shopify Details */}
          <div className="bg-zinc-800/30 p-4 rounded-md">
            <div className="flex justify-center mb-4">
              <ShopifyLogo className="h-8 w-auto" />
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-orange-400 font-medium">Order Number:</span>
                <span className="text-zinc-300 ml-2">{item.shopify_order_number}</span>
              </div>
              <div>
                <span className="text-orange-400 font-medium">SKU:</span>
                <span className="text-zinc-300 ml-2">{item.sku}</span>
              </div>
              <div>
                <span className="text-orange-400 font-medium">Item Description:</span>
                <div className="text-zinc-300 mt-1">{item.title}</div>
              </div>
              <div>
                <span className="text-orange-400 font-medium">Quantity Required:</span>
                <span className="text-zinc-300 ml-2">{item.quantity}</span>
              </div>
              <div>
                <span className="text-orange-400 font-medium">Price Sold For:</span>
                <span className="text-zinc-300 ml-2">
                  {item.price_ex_vat !== null ? (
                    <>
                      {formatCurrency(item.price_ex_vat)}
                      <span className="text-xs text-zinc-500 ml-1">(ex VAT)</span>
                    </>
                  ) : (
                    "N/A"
                  )}
                </span>
              </div>
            </div>
          </div>
          
          {/* Pinnacle Details */}
          <div className="bg-zinc-800/30 p-4 rounded-md">
            <div className="flex justify-center mb-4">
              <PinnacleLogo className="h-8 w-auto" />
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-green-500 font-medium">Stock:</span>
                <span className="text-zinc-300 ml-2">
                  {effectivePinnacleData.stock_quantity !== null ? effectivePinnacleData.stock_quantity : "N/A"}
                  <span className="text-zinc-500 text-sm ml-2">
                    ({totalPickedForOthers > 0 ? `${totalPickedForOthers} picked for other orders` : "none picked"})
                  </span>
                </span>
              </div>
              <div>
                <span className="text-green-500 font-medium">Description:</span>
                <div className="text-zinc-300 mt-1">{effectivePinnacleData.description || "N/A"}</div>
              </div>
              <div>
                <span className="text-green-500 font-medium">Location:</span>
                <span className="text-zinc-300 ml-2">{effectivePinnacleData.bin_location || "N/A"}</span>
              </div>
              <div>
                <span className="text-green-500 font-medium">Cost:</span>
                <span className="text-zinc-300 ml-2">
                  {effectivePinnacleData.cost !== null ? formatCurrency(effectivePinnacleData.cost) : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Notes */}
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
        
        {/* Actions */}
        <div className="mt-6 space-y-4">
          <h3 className="text-orange-400 font-medium mb-2">Choose an Action:</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Pick Full Order */}
            <Button
              onClick={handlePickFullOrder}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Pick Full Order ({item.quantity})
            </Button>
            
            {/* Order Full Order */}
            <Button
              onClick={handleOrderFullOrder}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Order Full Order from HD
            </Button>
            
            {/* Part Pick (only if quantity > 1) */}
            {item.quantity > 1 && (
              <div className="flex space-x-2">
                <Select 
                  value={partialQuantity.toString()} 
                  onValueChange={(value) => setPartialQuantity(parseInt(value))}
                >
                  <SelectTrigger className="w-24 bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Qty" />
                  </SelectTrigger>
                  <SelectContent>
                    {getQuantityOptions()}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handlePartialPick}
                  disabled={isProcessing || partialQuantity <= 0}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Part Pick & Order Rest
                </Button>
              </div>
            )}
          </div>
        </div>
        
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
