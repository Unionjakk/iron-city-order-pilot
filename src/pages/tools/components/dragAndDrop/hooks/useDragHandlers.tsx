
import { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { DragAndDropOrderItem } from "../../../types/dragAndDropTypes";

interface UseDragHandlersProps {
  orderItems: DragAndDropOrderItem[];
  setActiveItem: (item: DragAndDropOrderItem | null) => void;
  setDraggedItem: (item: DragAndDropOrderItem | null) => void;
  setTargetColumn: (column: string) => void;
  setShowConfirmDialog: (show: boolean) => void;
  setShowToDispatchDialog: (show: boolean) => void;
  setShowOrderedDialog: (show: boolean) => void;
}

export function useDragHandlers({
  orderItems,
  setActiveItem,
  setDraggedItem,
  setTargetColumn,
  setShowConfirmDialog,
  setShowToDispatchDialog,
  setShowOrderedDialog
}: UseDragHandlersProps) {
  
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = orderItems.find(item => item.id === active.id);
    
    if (item) {
      setActiveItem(item);
    }
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveItem(null);
      return;
    }
    
    const item = orderItems.find(item => item.id === active.id);
    if (!item) {
      setActiveItem(null);
      return;
    }
    
    const columnId = over.id.toString();
    if (!columnId.startsWith("column-")) {
      setActiveItem(null);
      return;
    }
    
    const targetColumnId = columnId.replace("column-", "");
    
    if (
      (item.progress === "To Pick" && targetColumnId === "to-pick") ||
      (item.progress === "to pick" && targetColumnId === "to-pick") ||
      (item.progress === "Picked" && targetColumnId === "picked") ||
      (item.progress === "picked" && targetColumnId === "picked") ||
      (item.progress === "To Order" && targetColumnId === "to-order") ||
      (item.progress === "to order" && targetColumnId === "to-order") ||
      (item.progress === "Ordered" && targetColumnId === "ordered") ||
      (item.progress === "ordered" && targetColumnId === "ordered") ||
      (item.progress === "To Dispatch" && targetColumnId === "to-dispatch") ||
      (item.progress === "to dispatch" && targetColumnId === "to-dispatch")
    ) {
      setActiveItem(null);
      return;
    }
    
    if (targetColumnId === "to-dispatch") {
      setDraggedItem(item);
      setTargetColumn(targetColumnId);
      setShowToDispatchDialog(true);
    } else if (targetColumnId === "ordered") {
      setDraggedItem(item);
      setTargetColumn(targetColumnId);
      setShowOrderedDialog(true);
    } else {
      setDraggedItem(item);
      setTargetColumn(targetColumnId);
      setShowConfirmDialog(true);
    }
    
    setActiveItem(null);
  };
  
  return {
    handleDragStart,
    handleDragEnd
  };
}
