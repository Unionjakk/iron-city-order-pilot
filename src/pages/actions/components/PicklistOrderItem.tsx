
import React, { useState, useEffect } from "react";
import { PicklistOrderItem as PicklistOrderItemType, PicklistOrder } from "../types/picklistTypes";
import { TableCell, TableRow } from "@/components/ui/table";
import { fetchTotalPickedQuantityForSku } from "../services/pickedDataService";
import { usePicklistItemActions } from "../hooks/usePicklistItemActions";
import { usePicklistItemHandler } from "../hooks/usePicklistItemHandler";
import ItemQuantityDisplay from "./picklist-item/ItemQuantityDisplay";
import StockInfoDisplay from "./picklist-item/StockInfoDisplay";
import PicklistItemActions from "./picklist-item/PicklistItemActions";
import NotesInput from "./picklist-item/NotesInput";

interface PicklistOrderItemProps {
  item: PicklistOrderItemType;
  order: PicklistOrder;
  refreshData: () => void;
}

const PicklistOrderItem = ({ item, order, refreshData }: PicklistOrderItemProps) => {
  const [pickedQuantity, setPickedQuantity] = useState<number | null>(null);

  const { 
    getStockColor,
    getLocationColor,
    getCostColor
  } = usePicklistItemActions(order, item.id, item.sku, refreshData);

  const {
    action,
    note,
    processing,
    pickQuantity,
    handleActionChange,
    handleNoteChange,
    handlePickQuantityChange,
    handleSubmit
  } = usePicklistItemHandler(order, item.sku, item.quantity, refreshData);

  useEffect(() => {
    if (item.sku) {
      const loadPickedQuantity = async () => {
        const pickedQty = await fetchTotalPickedQuantityForSku(item.sku);
        setPickedQuantity(pickedQty);
      };
      
      loadPickedQuantity();
    }
  }, [item.sku]);

  return (
    <React.Fragment>
      <TableRow className="hover:bg-zinc-800/30 border-t border-zinc-800/30">
        <TableCell className="font-mono text-zinc-300 pr-1">{item.sku || "No SKU"}</TableCell>
        <TableCell className="pl-1 text-orange-400">{item.title}</TableCell>
        <TableCell className="text-center">
          <ItemQuantityDisplay 
            quantity={item.quantity} 
            quantityPicked={item.quantity_picked} 
          />
        </TableCell>
        <TableCell className="text-center">
          {item.price ? `£${item.price.toFixed(2)}` : "N/A"}
        </TableCell>
        <TableCell className="text-center">
          <StockInfoDisplay 
            inStock={item.in_stock}
            stockQuantity={item.stock_quantity}
            pickedQuantity={pickedQuantity}
            stockColor={getStockColor(item.in_stock, item.stock_quantity, item.quantity)}
          />
        </TableCell>
        <TableCell>
          <span className={getLocationColor(item.in_stock)}>
            {item.bin_location || "N/A"}
          </span>
        </TableCell>
        <TableCell>
          <span className={getCostColor(item.in_stock, item.cost)}>
            {item.in_stock && item.cost ? `£${item.cost.toFixed(2)}` : "N/A"}
          </span>
        </TableCell>
        <TableCell>
          <PicklistItemActions 
            maxQuantity={item.quantity || 1}
            onActionChange={handleActionChange}
            onPickQuantityChange={handlePickQuantityChange}
            onSubmit={handleSubmit}
            action={action}
            pickQuantity={pickQuantity}
            processing={processing}
          />
        </TableCell>
        <TableCell>
          <button
            onClick={handleSubmit}
            disabled={!action || processing}
            className={`w-full text-center px-2 py-1 rounded text-sm ${
              !action || processing
                ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600 text-white"
            }`}
          >
            {processing ? "Saving..." : "Save"}
          </button>
        </TableCell>
      </TableRow>
      
      <TableRow className="border-none">
        <TableCell colSpan={9} className="pt-0 pb-2">
          <NotesInput note={note} onChange={handleNoteChange} />
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

export default PicklistOrderItem;
