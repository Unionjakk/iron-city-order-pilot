
import { useState } from "react";
import { Clipboard, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PinnacleSearchDialog from "./PinnacleSearchDialog";
import ActionDialog from "./ActionDialog";

interface PicklistItem {
  id: string;
  order_id: string;
  shopify_order_number: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  sku: string;
  title: string;
  quantity: number;
  price: number | null;
  price_ex_vat: number | null;
  pinnacle_stock_quantity: number | null;
  pinnacle_description: string | null;
  pinnacle_bin_location: string | null;
  pinnacle_cost: number | null;
  pinnacle_part_number: string | null;
}

interface PicklistOrderItemProps {
  item: PicklistItem;
  refreshData: () => void;
}

const PicklistOrderItem: React.FC<PicklistOrderItemProps> = ({ item, refreshData }) => {
  const [showPinnacleSearch, setShowPinnacleSearch] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [pinnacleData, setPinnacleData] = useState<any | null>(null);
  const { toast } = useToast();

  // Copy SKU to clipboard
  const handleCopySku = () => {
    navigator.clipboard.writeText(item.sku);
    toast({
      title: "SKU Copied",
      description: `${item.sku} copied to clipboard`,
    });
  };

  // Handle Pinnacle search completion
  const handlePinnacleSelected = (pinnacleItem: any) => {
    setPinnacleData(pinnacleItem);
    setShowPinnacleSearch(false);
    setShowActionDialog(true);
  };

  // Format currency
  const formatCurrency = (value: number | null) => {
    if (value === null) return "N/A";
    return `£${value.toFixed(2)}`;
  };

  return (
    <>
      <tr className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
        <td className="py-3">
          <div className="flex items-center space-x-2">
            <span 
              className="text-zinc-300 font-mono text-sm cursor-pointer hover:text-orange-400"
              onClick={handleCopySku}
            >
              {item.sku}
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
        <td className="py-3">
          <div className="max-w-md text-sm">
            <span className="text-zinc-300">{item.title}</span>
          </div>
        </td>
        <td className="py-3 text-center">
          <span className="font-medium text-orange-500">{item.quantity}</span>
        </td>
        <td className="py-3 text-center">
          {item.price_ex_vat ? (
            <div className="text-zinc-300">
              {formatCurrency(item.price_ex_vat)}
              <span className="text-xs text-zinc-500 ml-1">Ex VAT</span>
            </div>
          ) : (
            <span className="text-zinc-500">--</span>
          )}
        </td>
        <td className="py-3 text-center">
          <span className="text-green-500">
            {item.pinnacle_stock_quantity !== null ? item.pinnacle_stock_quantity : 'N/A'}
          </span>
        </td>
        <td className="py-3 text-center">
          <span className="text-green-500">
            {item.pinnacle_bin_location || 'N/A'}
          </span>
        </td>
        <td className="py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-green-500">
              {item.pinnacle_cost !== null ? formatCurrency(item.pinnacle_cost) : 'N/A'}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-green-500 hover:text-green-400"
              onClick={() => setShowPinnacleSearch(true)}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </td>
        <td className="py-3 text-right">
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-orange-500 bg-orange-500 text-white hover:bg-orange-600"
            onClick={() => setShowActionDialog(true)}
          >
            ACTION
          </Button>
        </td>
      </tr>

      {/* Pinnacle Search Dialog */}
      {showPinnacleSearch && (
        <PinnacleSearchDialog
          isOpen={showPinnacleSearch}
          onClose={() => setShowPinnacleSearch(false)}
          sku={item.sku}
          shopifyOrderNumber={item.shopify_order_number}
          quantity={item.quantity}
          onItemSelected={handlePinnacleSelected}
        />
      )}

      {/* Action Dialog */}
      {showActionDialog && (
        <ActionDialog
          isOpen={showActionDialog}
          onClose={() => {
            setShowActionDialog(false);
            setPinnacleData(null);
          }}
          item={item}
          pinnacleData={pinnacleData}
          refreshData={refreshData}
        />
      )}
    </>
  );
};

export default PicklistOrderItem;
