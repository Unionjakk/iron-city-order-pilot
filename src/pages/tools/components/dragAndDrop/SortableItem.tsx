
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DragAndDropOrderItem } from "../../types/dragAndDropTypes";
import ItemCard from "./ItemCard";

interface SortableItemProps {
  item: DragAndDropOrderItem;
  disabled?: boolean;
}

const SortableItem: React.FC<SortableItemProps> = ({ item, disabled = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: item.id,
    disabled 
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <ItemCard item={item} isDragging={isDragging} />
    </div>
  );
};

export default SortableItem;
