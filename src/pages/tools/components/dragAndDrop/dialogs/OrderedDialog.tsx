
import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DragAndDropOrderItem } from "../../../types/dragAndDropTypes";

interface OrderedDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (dealerPo: string) => void;
  item: DragAndDropOrderItem | null;
}

const OrderedDialog: React.FC<OrderedDialogProps> = ({
  open,
  onClose,
  onConfirm,
  item
}) => {
  const [dealerPo, setDealerPo] = useState<string>(item?.dealer_po_number || "");
  const [error, setError] = useState<string | null>(null);
  
  if (!item) return null;
  
  const handleSubmit = () => {
    if (!dealerPo.trim()) {
      setError("Dealer PO number is required");
      return;
    }
    
    onConfirm(dealerPo);
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mark as Ordered</DialogTitle>
          <DialogDescription>
            Enter the dealer PO number for "{item.title}" (SKU: {item.sku || "N/A"})
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="dealerPo">Dealer PO Number</Label>
            <Input 
              id="dealerPo" 
              value={dealerPo} 
              onChange={(e) => {
                setDealerPo(e.target.value);
                setError(null);
              }}
              placeholder="e.g. PO12345"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderedDialog;
