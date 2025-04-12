
import React from "react";
import { DragOverlay } from "@dnd-kit/core";
import { DragAndDropOrderItem } from "../../types/dragAndDropTypes";
import ItemCard from "./ItemCard";
import { useProgressUpdate } from "../../hooks/useProgressUpdate";
import { useDragAndDropState } from "./hooks/useDragAndDropState";
import { DragAndDropContext } from "./DragAndDropContext";
import ColumnsDisplay from "./ColumnsDisplay";
import DialogManager from "./DialogManager";
import { getColumnsFromItems } from "./utils/columnUtils";

interface DragAndDropBoardProps {
  orderItems: DragAndDropOrderItem[];
  refreshData: () => void;
}

const DragAndDropBoard: React.FC<DragAndDropBoardProps> = ({ orderItems, refreshData }) => {
  const columns = getColumnsFromItems(orderItems);
  
  const {
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
  } = useDragAndDropState();
  
  const { updateItemProgress, isUpdating } = useProgressUpdate({ refreshData });
  
  const handleConfirmProgressUpdate = (notes?: string) => {
    if (draggedItem && targetColumn) {
      const progressMapping: Record<string, string> = {
        "to-pick": "To Pick",
        "picked": "Picked",
        "to-order": "To Order",
        "ordered": "Ordered",
        "to-dispatch": "To Dispatch"
      };
      
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
      <DragAndDropContext
        orderItems={orderItems}
        setActiveItem={setActiveItem}
        setDraggedItem={setDraggedItem}
        setTargetColumn={setTargetColumn}
        setShowConfirmDialog={setShowConfirmDialog}
        setShowToDispatchDialog={setShowToDispatchDialog}
        setShowOrderedDialog={setShowOrderedDialog}
      >
        <ColumnsDisplay 
          columns={columns} 
          isUpdating={isUpdating} 
        />
        
        <DragOverlay>
          {activeItem && <ItemCard item={activeItem} isDragging />}
        </DragOverlay>
      </DragAndDropContext>
      
      <DialogManager
        showConfirmDialog={showConfirmDialog}
        setShowConfirmDialog={setShowConfirmDialog}
        showToDispatchDialog={showToDispatchDialog}
        setShowToDispatchDialog={setShowToDispatchDialog}
        showOrderedDialog={showOrderedDialog}
        setShowOrderedDialog={setShowOrderedDialog}
        draggedItem={draggedItem}
        targetColumn={targetColumn}
        onConfirmProgressUpdate={handleConfirmProgressUpdate}
        onToDispatchConfirm={handleToDispatchConfirm}
        onOrderedConfirm={handleOrderedConfirm}
      />
    </>
  );
};

export default DragAndDropBoard;
