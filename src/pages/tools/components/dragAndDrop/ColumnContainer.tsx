
import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DragAndDropColumn } from "../../types/dragAndDropTypes";
import SortableItem from "./SortableItem";

interface ColumnContainerProps {
  column: DragAndDropColumn;
  isUpdating: boolean;
}

const ColumnContainer: React.FC<ColumnContainerProps> = ({ column, isUpdating }) => {
  // Get items IDs for the sortable context
  const itemIds = column.items.map(item => item.id);
  
  // Setup droppable
  const { setNodeRef } = useDroppable({
    id: `column-${column.id}`,
  });
  
  // Helper for column title and color
  const getColumnColor = () => {
    switch (column.id) {
      case "to-pick":
        return "bg-yellow-500/20 text-yellow-300";
      case "picked":
        return "bg-green-500/20 text-green-300";
      case "to-order":
        return "bg-purple-500/20 text-purple-300";
      case "ordered":
        return "bg-blue-500/20 text-blue-300";
      case "to-dispatch":
        return "bg-pink-500/20 text-pink-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };
  
  // Helper for column header background
  const getColumnHeaderBg = () => {
    switch (column.id) {
      case "to-pick":
        return "text-yellow-400 border-yellow-500/50";
      case "picked":
        return "text-green-400 border-green-500/50";
      case "to-order":
        return "text-purple-400 border-purple-500/50";
      case "ordered":
        return "text-blue-400 border-blue-500/50";
      case "to-dispatch":
        return "text-pink-400 border-pink-500/50";
      default:
        return "text-gray-400 border-gray-500/50";
    }
  };
  
  return (
    <div 
      ref={setNodeRef}
      className="flex-shrink-0 w-full md:w-80 h-full rounded-md flex flex-col bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50"
    >
      <div className={`flex items-center justify-between p-3 border-b ${getColumnHeaderBg()}`}>
        <h3 className="font-medium">{column.title}</h3>
        <div className={`px-2 py-0.5 rounded-full text-xs ${getColumnColor()}`}>
          {column.items.length}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 max-h-[calc(100vh-300px)]">
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {column.items.length === 0 ? (
            <div className="flex items-center justify-center h-20 text-zinc-500 text-sm border border-dashed border-zinc-700 rounded-md">
              No items
            </div>
          ) : (
            <div className="space-y-2">
              {column.items.map(item => (
                <SortableItem 
                  key={item.id} 
                  item={item} 
                  disabled={isUpdating}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
};

export default ColumnContainer;
