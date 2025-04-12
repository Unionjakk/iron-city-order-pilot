
import React from "react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import { DragAndDropOrderItem } from "../../../types/dragAndDropTypes";

interface ToDispatchDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  item: DragAndDropOrderItem | null;
}

const ToDispatchDialog: React.FC<ToDispatchDialogProps> = ({
  open,
  onClose,
  onConfirm,
  item
}) => {
  if (!item) return null;
  
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            Move to Dispatch
          </AlertDialogTitle>
          <AlertDialogDescription>
            <p className="mb-2">
              This will move <strong>ALL items</strong> in order #{item.orderNumber} to "To Dispatch" status.
              This action implies that all items for this order are ready to be dispatched.
            </p>
            <p>
              Are you sure you want to do this?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ToDispatchDialog;
