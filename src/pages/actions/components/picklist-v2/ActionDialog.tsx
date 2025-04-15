
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ShopifyLogo from "./ShopifyLogo";
import PinnacleLogo from "./PinnacleLogo";
import { fetchTotalPickedQuantityForSku } from "../../services/pickedDataService";

interface ActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
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
  const [totalPickedForSku, setTotalPickedForSku] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPartialWarning, setShowPartialWarning] = useState(false);
  const [showLowStockWarning, setShowLowStockWarning] = useState(false);
  const { toast } = useToast();
  
  // Use passed pinnacle data or item data
  const stockQuantity = pinnacleData?.stock_quantity ?? item.pinnacle_stock_quantity;
  const binLocation = pinnacleData?.bin_location ?? item.pinnacle_bin_location;
  const pinnacleDescription = pinnacleData?.description ?? item.pinnacle_description;
  const cost = pinnacleData?.cost ?? item.pinnacle_cost;
  const correctedSku = pinnacleData?.corrected_sku ?? item.pinnacle_part_number;
  
  // Calculate if partial pick is available
  const canPartialPick = item.quantity > 1;
  
  // Load total picked quantity
  useState(() => {
    const loadTotalPicked = async () => {
      const total = await fetchTotalPickedQuantityForSku(item.sku);
      setTotalPickedForSku(total);
    };
    
    loadTotalPicked();
  });
  
  // Format currency
  const formatCurrency = (value: number | null) => {
    if (value === null) return "N/A";
    return `£${value.toFixed(2)}`;
  };
  
  // Handle picking the order
  const handlePickOrder = async () => {
    // Check if stock is sufficient
    if (stockQuantity !== null && stockQuantity < item.quantity) {
      setShowLowStockWarning(true);
      return;
    }
    
    await addOrderProgress("Picked", false, item.quantity);
  };
  
  // Handle ordering the full order
  const handleOrderFullOrder = async () => {
    await addOrderProgress("To Order", false, 0);
  };
  
  // Handle partial pick
  const handlePartialPick = async () => {
    // Validate the picked quantity
    if (partialQuantity <= 0 || partialQuantity >= item.quantity) {
      setShowPartialWarning(true);
      return;
    }
    
    // Check if stock is sufficient
    if (stockQuantity !== null && stockQuantity < partialQuantity) {
      setShowLowStockWarning(true);
      return;
    }
    
    await addOrderProgress("To Order", true, partialQuantity);
  };
  
  // Add order progress record
  const addOrderProgress = async (progress: string, isPartial: boolean, quantityPicked: number) => {
    setIsProcessing(true);
    
    try {
      // Create shopify_ordersku_combo
      const shopifyOrderSkuCombo = `${item.shopify_order_number}${item.sku}`;
      
      // Create the record
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
          quantity_picked: progress === "Picked" ? item.quantity : (isPartial ? quantityPicked : 0),
          is_partial: isPartial,
          shopify_ordersku_combo: shopifyOrderSkuCombo,
          pinnacle_sku_matched: correctedSku
        });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: isPartial 
          ? `Item has been partially picked (${quantityPicked} of ${item.quantity}) and the rest will be ordered`
          : `Item marked as ${progress}`,
      });
      
      onClose();
      refreshData();
    } catch (error: any) {
      console.error("Error updating progress:", error);
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Confirm low stock pick
  const confirmLowStockPick = async () => {
    setShowLowStockWarning(false);
    await addOrderProgress("Picked", false, item.quantity);
  };
  
  // Dismiss partial warning
  const dismissPartialWarning = () => {
    setShowPartialWarning(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-xl text-orange-400">Progress this Shopify Order Line Item</DialogTitle>
        </DialogHeader>
        
        {/* Low Stock Warning */}
        {showLowStockWarning && (
          <div className="bg-amber-900/30 border border-amber-500/50 rounded-md p-4 mb-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
              <div>
                <h4 className="text-amber-500 font-medium">Not enough stock</h4>
                <p className="text-amber-300/80 text-sm mt-1">
                  The system shows only {stockQuantity} items in stock, but {item.quantity} are required. Do you still want to mark this as picked?
                </p>
                <div className="flex gap-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-amber-500 text-amber-500 hover:bg-amber-950"
                    onClick={() => setShowLowStockWarning(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="default"
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 text-black"
                    onClick={confirmLowStockPick}
                  >
                    Continue Anyway
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Partial Pick Warning */}
        {showPartialWarning && (
          <div className="bg-amber-900/30 border border-amber-500/50 rounded-md p-4 mb-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
              <div>
                <h4 className="text-amber-500 font-medium">Invalid quantity</h4>
                <p className="text-amber-300/80 text-sm mt-1">
                  The partial pick quantity must be greater than 0 and less than the total required quantity ({item.quantity}).
                </p>
                <div className="flex gap-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-amber-500 text-amber-500 hover:bg-amber-950"
                    onClick={dismissPartialWarning}
                  >
                    OK
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shopify Information */}
          <div className="space-y-4">
            <div className="flex justify-center mb-2">
              <ShopifyLogo className="h-8 w-auto" />
            </div>
            <div className="bg-zinc-800/40 rounded-md p-4 space-y-3">
              <div>
                <span className="text-orange-400 font-medium">Order Number:</span>
                <span className="text-zinc-300 ml-2">{item.shopify_order_number}</span>
              </div>
              <div>
                <span className="text-orange-400 font-medium">SKU:</span>
                <span className="text-zinc-300 ml-2 font-mono">{item.sku}</span>
              </div>
              <div>
                <span className="text-orange-400 font-medium">Item Description:</span>
                <p className="text-zinc-300 mt-1">{item.title}</p>
              </div>
              <div>
                <span className="text-orange-400 font-medium">Quantity Required:</span>
                <span className="text-zinc-300 ml-2 font-bold">{item.quantity}</span>
              </div>
              <div>
                <span className="text-orange-400 font-medium">Price Sold For:</span>
                <span className="text-zinc-300 ml-2">
                  {item.price_ex_vat ? (
                    <>
                      {formatCurrency(item.price_ex_vat)}
                      <span className="text-xs text-zinc-500 ml-1">(ex VAT)</span>
                    </>
                  ) : (
                    'N/A'
                  )}
                </span>
              </div>
            </div>
          </div>
          
          {/* Pinnacle Information */}
          <div className="space-y-4">
            <div className="flex justify-center mb-2">
              <PinnacleLogo className="h-8 w-auto" />
            </div>
            <div className="bg-zinc-800/40 rounded-md p-4 space-y-3">
              <div>
                <span className="text-green-500 font-medium">Stock:</span>
                <span className="text-zinc-300 ml-2">
                  {stockQuantity !== null ? stockQuantity : 'N/A'}
                  <span className="text-zinc-500 ml-2">
                    {totalPickedForSku 
                      ? `(${totalPickedForSku} picked for other orders)` 
                      : '(none picked for other orders)'}
                  </span>
                </span>
              </div>
              <div>
                <span className="text-green-500 font-medium">Description:</span>
                <p className="text-zinc-300 mt-1">{pinnacleDescription || 'N/A'}</p>
              </div>
              <div>
                <span className="text-green-500 font-medium">Location:</span>
                <span className="text-zinc-300 ml-2">{binLocation || 'N/A'}</span>
              </div>
              <div>
                <span className="text-green-500 font-medium">Cost:</span>
                <span className="text-zinc-300 ml-2">
                  {cost !== null ? formatCurrency(cost) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Notes Field */}
        <div className="mt-4">
          <Label htmlFor="notes" className="text-zinc-400 block mb-2">Notes</Label>
          <Input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-zinc-800/40 border-zinc-700 text-zinc-300"
            placeholder="Add notes about this item..."
          />
        </div>
        
        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            disabled={isProcessing}
            onClick={handlePickOrder}
          >
            {isProcessing ? "Processing..." : "Pick full order from Shopify"}
            <span className="ml-1 text-sm">({item.quantity} required)</span>
          </Button>
          
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isProcessing}
            onClick={handleOrderFullOrder}
          >
            {isProcessing ? "Processing..." : "Order full Shopify order from HD"}
          </Button>
          
          {canPartialPick && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Label htmlFor="partialQuantity" className="text-zinc-400 whitespace-nowrap">
                  Partial pick quantity:
                </Label>
                <Input
                  id="partialQuantity"
                  type="number"
                  min="1"
                  max={item.quantity - 1}
                  value={partialQuantity}
                  onChange={(e) => setPartialQuantity(parseInt(e.target.value) || 0)}
                  className="w-20 bg-zinc-800/40 border-zinc-700 text-zinc-300"
                />
              </div>
              
              <Button
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                disabled={isProcessing}
                onClick={handlePartialPick}
              >
                {isProcessing ? "Processing..." : "Part Pick this order and Order the rest from HD"}
              </Button>
            </div>
          )}
        </div>
        
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="border-zinc-700 text-zinc-400"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ActionDialog;
