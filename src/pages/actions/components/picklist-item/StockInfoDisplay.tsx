
import React from "react";

interface StockInfoDisplayProps {
  inStock: boolean;
  stockQuantity: number | null;
  pickedQuantity: number | null;
  stockColor: string;
}

const StockInfoDisplay = ({ inStock, stockQuantity, pickedQuantity, stockColor }: StockInfoDisplayProps) => {
  return (
    <span className={stockColor}>
      {stockQuantity || 0}
      {pickedQuantity ? <span className="text-amber-400"> ({pickedQuantity} picked total)</span> : null}
    </span>
  );
};

export default StockInfoDisplay;
