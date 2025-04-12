
import React from "react";
import { Clipboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import MatchToOrderDialog from "./MatchToOrderDialog";
import ResetProgressDialog from "./order-item/ResetProgressDialog";
import { useOrderItemActions } from "../hooks/useOrderItemActions";

interface OrderItemProps {
  id: string;
  shopify_order_id: string;
  shopify_order_number: string | null;
  sku: string;
  title: string;
  quantity: number;
  price: number | null;
  cost?: number | null;
  bin_location?: string | null;
  stock_quantity?: number | null;
  notes?: string | null;
  onItemUpdated: () => void;
}

const ToOrderOrderItem: React.FC<OrderItemProps> = ({
  id,
  shopify_order_id,
  shopify_order_number,
  sku,
  title,
  quantity,
  price,
  cost,
  bin_location,
  stock_quantity,
  notes,
  onItemUpdated
}) => {
  const [showMatchDialog, setShowMatchDialog] = React.useState(false);
  const [showResetDialog, setShowResetDialog] = React.useState(false);
  const { toast } = useToast();
  const { handleCopySku } = useOrderItemActions(sku, toast);

  return (
    <>
      <tr className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
        <td className="p-3">
          <div className="flex items-center space-x-2">
            <span 
              className="text-zinc-300 font-mono text-sm cursor-pointer hover:text-orange-400"
              onClick={handleCopySku}
            >
              {sku}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-zinc-400 hover:text-orange-400" 
              onClick={handleCopySku}
            >
              <Clipboard className="h-4 w-4" />
            </Button>
          </div>
        </td>
        <td className="p-3">
          <div className="max-w-md text-sm">
            <span className="text-zinc-300">{title}</span>
          </div>
        </td>
        <td className="p-3 text-center">
          <span className="font-medium text-orange-500">{quantity}</span>
        </td>
        <td className="p-3 text-center">
          {price ? (
            <span className="text-zinc-300">£{price.toFixed(2)}</span>
          ) : (
            <span className="text-zinc-500">--</span>
          )}
        </td>
        <td className="p-3 text-center">
          {stock_quantity !== null && stock_quantity !== undefined ? (
            <span className={`${stock_quantity > 0 ? 'text-green-500' : 'text-amber-500'}`}>
              {stock_quantity}
            </span>
          ) : (
            <span className="text-zinc-500">--</span>
          )}
        </td>
        <td className="p-3 text-center">
          {bin_location ? (
            <span className="text-zinc-300">{bin_location}</span>
          ) : (
            <span className="text-zinc-500">--</span>
          )}
        </td>
        <td className="p-3 text-center">
          {cost ? (
            <span className="text-zinc-300">£{cost.toFixed(2)}</span>
          ) : (
            <span className="text-zinc-500">--</span>
          )}
        </td>
        <td className="p-3 text-center">
          <span className="bg-orange-500/20 text-orange-400 px-2 py-1 text-xs rounded-full whitespace-nowrap">
            To Order
          </span>
        </td>
        <td className="p-3">
          <div className="flex justify-end space-x-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-orange-500 bg-orange-500 text-white hover:bg-orange-600"
              onClick={() => setShowMatchDialog(true)}
            >
              Match Order
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
              onClick={() => setShowResetDialog(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>

      <MatchToOrderDialog
        isOpen={showMatchDialog}
        onClose={() => setShowMatchDialog(false)}
        sku={sku}
        shopifyOrderId={shopify_order_id}
        shopifyOrderNumber={shopify_order_number}
        onOrderMatched={onItemUpdated}
        quantity={quantity}
      />

      <ResetProgressDialog
        isOpen={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        shopifyOrderId={shopify_order_id}
        sku={sku}
        onReset={onItemUpdated}
      />
    </>
  );
};

export default ToOrderOrderItem;
