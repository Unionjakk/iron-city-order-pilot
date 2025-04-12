
import React from "react";
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useDragHandlers } from "./hooks/useDragHandlers";
import { DragAndDropOrderItem } from "../../types/dragAndDropTypes";

interface DragAndDropContextProps {
  children: React.ReactNode;
  orderItems: DragAndDropOrderItem[];
  setActiveItem: (item: DragAndDropOrderItem | null) => void;
  setDraggedItem: (item: DragAndDropOrderItem | null) => void;
  setTargetColumn: (column: string) => void;
  setShowConfirmDialog: (show: boolean) => void;
  setShowToDispatchDialog: (show: boolean) => void;
  setShowOrderedDialog: (show: boolean) => void;
}

export const DragAndDropContext: React.FC<DragAndDropContextProps> = ({
  children,
  orderItems,
  setActiveItem,
  setDraggedItem,
  setTargetColumn,
  setShowConfirmDialog,
  setShowToDispatchDialog,
  setShowOrderedDialog
}) => {
  const { handleDragStart, handleDragEnd } = useDragHandlers({
    orderItems,
    setActiveItem,
    setDraggedItem,
    setTargetColumn,
    setShowConfirmDialog,
    setShowToDispatchDialog,
    setShowOrderedDialog
  });
  
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
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
    </DndContext>
  );
};
