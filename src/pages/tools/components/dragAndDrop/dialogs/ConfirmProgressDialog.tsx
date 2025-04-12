
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DragAndDropOrderItem } from "../../../types/dragAndDropTypes";

interface ConfirmProgressDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (notes?: string) => void;
  item: DragAndDropOrderItem | null;
  targetStatus: string;
}

const ConfirmProgressDialog: React.FC<ConfirmProgressDialogProps> = ({
  open,
  onClose,
  onConfirm,
  item,
  targetStatus
}) => {
  const [notes, setNotes] = useState<string>(item?.notes || "");
  
  if (!item) return null;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm Status Change</DialogTitle>
          <DialogDescription>
            Change status of "{item.title}" (SKU: {item.sku || "N/A"}) to "{targetStatus}"?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea 
              id="notes" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes here..."
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onConfirm(notes)}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmProgressDialog;
