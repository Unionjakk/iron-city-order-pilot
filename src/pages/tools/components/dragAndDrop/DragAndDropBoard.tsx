import React, { useState, useMemo } from "react";
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { DragAndDropOrderItem, DragAndDropColumn } from "../../types/dragAndDropTypes";
import ColumnContainer from "./ColumnContainer";
import ItemCard from "./ItemCard";
import { useProgressUpdate } from "../../hooks/useProgressUpdate";
import ConfirmProgressDialog from "./dialogs/ConfirmProgressDialog";
import ToDispatchDialog from "./dialogs/ToDispatchDialog";
import OrderedDialog from "./dialogs/OrderedDialog";

interface DragAndDropBoardProps {
  orderItems: DragAndDropOrderItem[];
  refreshData: () => void;
}

const DragAndDropBoard: React.FC<DragAndDropBoardProps> = ({ orderItems, refreshData }) => {
  const columns = useMemo(() => {
    const toPickItems = orderItems.filter(item => item.progress === "To Pick" || item.progress === "to pick");
    const pickedItems = orderItems.filter(item => item.progress === "Picked" || item.progress === "picked");
    const toOrderItems = orderItems.filter(item => item.progress === "To Order" || item.progress === "to order");
    const orderedItems = orderItems.filter(item => item.progress === "Ordered" || item.progress === "ordered");
    const toDispatchItems = orderItems.filter(item => item.progress === "To Dispatch" || item.progress === "to dispatch");
    
    return [
      {
        id: "to-pick",
        title: "To Pick",
        items: toPickItems
      },
      {
        id: "picked",
        title: "Picked",
        items: pickedItems
      },
      {
        id: "to-order",
        title: "To Order",
        items: toOrderItems
      },
      {
        id: "ordered",
        title: "Ordered",
        items: orderedItems
      },
      {
        id: "to-dispatch",
        title: "To Dispatch",
        items: toDispatchItems
      }
    ];
  }, [orderItems]);
  
  const [activeItem, setActiveItem] = useState<DragAndDropOrderItem | null>(null);
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showToDispatchDialog, setShowToDispatchDialog] = useState(false);
  const [showOrderedDialog, setShowOrderedDialog] = useState(false);
  const [draggedItem, setDraggedItem] = useState<DragAndDropOrderItem | null>(null);
  const [targetColumn, setTargetColumn] = useState<string>("");
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const { updateItemProgress, isUpdating } = useProgressUpdate({ refreshData });
  
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
  
  const progressMapping: Record<string, string> = {
    "to-pick": "To Pick",
    "picked": "Picked",
    "to-order": "To Order",
    "ordered": "Ordered",
    "to-dispatch": "To Dispatch"
  };
  
  const handleConfirmProgressUpdate = (notes?: string) => {
    if (draggedItem && targetColumn) {
      const newProgress = progressMapping[targetColumn];
      
      updateItemProgress({
        shopifyOrderId: draggedItem.shopifyOrderId,
        sku: draggedItem.sku,
        progress: newProgress,
        notes: notes || draggedItem.notes
      });
    }
    
    setShowConfirmDialog(false);
    setDraggedItem(null);
    setTargetColumn("");
  };
  
  const handleToDispatchConfirm = () => {
    if (draggedItem) {
      updateItemProgress({
        shopifyOrderId: draggedItem.shopifyOrderId,
        sku: draggedItem.sku,
        progress: "To Dispatch"
      });
    }
    
    setShowToDispatchDialog(false);
    setDraggedItem(null);
    setTargetColumn("");
  };
  
  const handleOrderedConfirm = (dealerPo: string) => {
    if (draggedItem) {
      updateItemProgress({
        shopifyOrderId: draggedItem.shopifyOrderId,
        sku: draggedItem.sku,
        progress: "Ordered",
        dealer_po_number: dealerPo
      });
    }
    
    setShowOrderedDialog(false);
    setDraggedItem(null);
    setTargetColumn("");
  };
  
  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4">
          {columns.map(column => (
            <ColumnContainer
              key={column.id}
              column={column}
              isUpdating={isUpdating}
            />
          ))}
        </div>
        
        <DragOverlay>
          {activeItem && <ItemCard item={activeItem} isDragging />}
        </DragOverlay>
      </DndContext>
      
      <ConfirmProgressDialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmProgressUpdate}
        item={draggedItem}
        targetStatus={targetColumn ? progressMapping[targetColumn] : ""}
      />
      
      <ToDispatchDialog
        open={showToDispatchDialog}
        onClose={() => setShowToDispatchDialog(false)}
        onConfirm={handleToDispatchConfirm}
        item={draggedItem}
      />
      
      <OrderedDialog
        open={showOrderedDialog}
        onClose={() => setShowOrderedDialog(false)}
        onConfirm={handleOrderedConfirm}
        item={draggedItem}
      />
    </>
  );
};

export default DragAndDropBoard;
