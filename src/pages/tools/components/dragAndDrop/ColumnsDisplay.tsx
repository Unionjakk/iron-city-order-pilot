
import React from "react";
import { DragAndDropColumn } from "../../types/dragAndDropTypes";
import ColumnContainer from "./ColumnContainer";

interface ColumnsDisplayProps {
  columns: DragAndDropColumn[];
  isUpdating: boolean;
}

const ColumnsDisplay: React.FC<ColumnsDisplayProps> = ({ columns, isUpdating }) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4">
      {columns.map(column => (
        <ColumnContainer
          key={column.id}
          column={column}
          isUpdating={isUpdating}
        />
      ))}
    </div>
  );
};

export default ColumnsDisplay;
