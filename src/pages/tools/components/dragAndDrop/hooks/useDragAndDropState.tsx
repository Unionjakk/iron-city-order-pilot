
import { useState } from "react";
import { DragAndDropOrderItem } from "../../../types/dragAndDropTypes";

export function useDragAndDropState() {
  const [activeItem, setActiveItem] = useState<DragAndDropOrderItem | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showToDispatchDialog, setShowToDispatchDialog] = useState(false);
  const [showOrderedDialog, setShowOrderedDialog] = useState(false);
  const [draggedItem, setDraggedItem] = useState<DragAndDropOrderItem | null>(null);
  const [targetColumn, setTargetColumn] = useState<string>("");
  
  return {
    activeItem,
    setActiveItem,
    showConfirmDialog, 
    setShowConfirmDialog,
    showToDispatchDialog, 
    setShowToDispatchDialog,
    showOrderedDialog, 
    setShowOrderedDialog,
    draggedItem, 
    setDraggedItem,
    targetColumn, 
    setTargetColumn
  };
}
