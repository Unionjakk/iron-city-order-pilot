
import React from "react";
import { DragAndDropOrderItem } from "../../types/dragAndDropTypes";
import ConfirmProgressDialog from "./dialogs/ConfirmProgressDialog";
import ToDispatchDialog from "./dialogs/ToDispatchDialog";
import OrderedDialog from "./dialogs/OrderedDialog";
import { progressMapping } from "./utils/columnUtils";

interface DialogManagerProps {
  showConfirmDialog: boolean;
  setShowConfirmDialog: (show: boolean) => void;
  showToDispatchDialog: boolean;
  setShowToDispatchDialog: (show: boolean) => void;
  showOrderedDialog: boolean;
  setShowOrderedDialog: (show: boolean) => void;
  draggedItem: DragAndDropOrderItem | null;
  targetColumn: string;
  onConfirmProgressUpdate: (notes?: string) => void;
  onToDispatchConfirm: () => void;
  onOrderedConfirm: (dealerPo: string) => void;
}

const DialogManager: React.FC<DialogManagerProps> = ({
  showConfirmDialog,
  setShowConfirmDialog,
  showToDispatchDialog,
  setShowToDispatchDialog,
  showOrderedDialog,
  setShowOrderedDialog,
  draggedItem,
  targetColumn,
  onConfirmProgressUpdate,
  onToDispatchConfirm,
  onOrderedConfirm
}) => {
  return (
    <>
      <ConfirmProgressDialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={onConfirmProgressUpdate}
        item={draggedItem}
        targetStatus={targetColumn ? progressMapping[targetColumn] : ""}
      />
      
      <ToDispatchDialog
        open={showToDispatchDialog}
        onClose={() => setShowToDispatchDialog(false)}
        onConfirm={onToDispatchConfirm}
        item={draggedItem}
      />
      
      <OrderedDialog
        open={showOrderedDialog}
        onClose={() => setShowOrderedDialog(false)}
        onConfirm={onOrderedConfirm}
        item={draggedItem}
      />
    </>
  );
};

export default DialogManager;
