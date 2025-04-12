
import React from "react";

interface ItemQuantityDisplayProps {
  quantity: number;
  quantityPicked?: number;
}

const ItemQuantityDisplay = ({ quantity, quantityPicked }: ItemQuantityDisplayProps) => {
  return (
    <div>
      {quantity}
      {quantityPicked && quantityPicked > 0 && (
        <span className="text-orange-300 text-sm ml-1">({quantityPicked} picked)</span>
      )}
    </div>
  );
};

export default ItemQuantityDisplay;
