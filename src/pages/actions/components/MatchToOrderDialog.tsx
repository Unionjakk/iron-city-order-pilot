import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import HarleyOrdersTable, { HarleyOrderMatch } from "./harley-orders/HarleyOrdersTable";
import HarleyOrderSearchForm from "./harley-orders/HarleyOrderSearchForm";
import { formatDate } from "../utils/dateUtils";
import { searchHarleyOrders, matchToHarleyOrder } from "../services/harleyOrdersService";

interface MatchToOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sku: string;
  shopifyLineItemId: string;
  shopifyOrderNumber: string | null;
  onOrderMatched: () => void;
  quantity?: number;
}

const MatchToOrderDialog = ({
  isOpen,
  onClose,
  sku,
  shopifyLineItemId,
  shopifyOrderNumber,
  onOrderMatched,
  quantity = 1
}: MatchToOrderDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [matchedOrders, setMatchedOrders] = useState<HarleyOrderMatch[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [searchTerm, setSearchTerm] = useState(sku);

  useEffect(() => {
    if (isOpen && sku) {
      setSearchTerm(sku);
      handleSearch(sku);
    } else {
      setMatchedOrders([]);
    }
  }, [isOpen, sku]);

  const handleSearch = async (searchSku: string) => {
    if (!searchSku || searchSku.trim() === "") {
      toast.error("Please enter a valid SKU to search");
      return;
    }

    try {
      setIsLoading(true);
      const data = await searchHarleyOrders(searchSku);
      setMatchedOrders(data);
    } catch (error: any) {
      console.error("Error searching Harley orders:", error);
      toast.error("Failed to search for Harley orders");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchTerm);
  };

  const handleMatchToOrder = async (order: HarleyOrderMatch) => {
    try {
      setIsMatching(true);
      await matchToHarleyOrder(order, shopifyLineItemId, sku);
      toast.success("Successfully matched to Harley order");
      onOrderMatched();
      onClose();
    } catch (error: any) {
      console.error("Error matching to order:", error);
      toast.error("Failed to match to Harley order");
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-orange-400">Match to Harley Order</DialogTitle>
          <DialogDescription className="text-zinc-300">
            Search for and match the item ({sku}) to a Harley Davidson order
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-zinc-800/50 px-4 py-2 rounded-md mb-4">
          <div className="flex justify-between items-center">
            <span className="text-orange-400 font-medium">Quantity Required:</span>
            <span className="text-orange-500 font-bold">{quantity}</span>
          </div>
        </div>
        
        <HarleyOrderSearchForm 
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onSearch={handleSearchSubmit}
          isLoading={isLoading}
        />

        <div className="mt-4 max-h-96 overflow-auto">
          {isLoading ? (
            <div className="text-center py-8 text-zinc-400">
              Searching...
            </div>
          ) : (
            <HarleyOrdersTable 
              orders={matchedOrders}
              isMatching={isMatching}
              onMatchOrder={handleMatchToOrder}
              formatDateFn={formatDate}
            />
          )}
        </div>
        
        <DialogFooter className="mt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MatchToOrderDialog;
