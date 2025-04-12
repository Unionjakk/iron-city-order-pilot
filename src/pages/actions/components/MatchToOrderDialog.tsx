
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Search, X } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface HarleyOrderMatch {
  hd_order_number: string;
  part_number: string;
  dealer_po_number: string | null;
  order_quantity: number | null;
  status: string | null;
  hd_orderlinecombo: string | null;
}

interface MatchToOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sku: string;
  shopifyOrderId: string;
  shopifyOrderNumber: string | null;
  onOrderMatched: () => void;
}

const MatchToOrderDialog = ({
  isOpen,
  onClose,
  sku,
  shopifyOrderId,
  shopifyOrderNumber,
  onOrderMatched
}: MatchToOrderDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [matchedOrders, setMatchedOrders] = useState<HarleyOrderMatch[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [searchTerm, setSearchTerm] = useState(sku);

  useEffect(() => {
    if (isOpen && sku) {
      setSearchTerm(sku);
      searchHarleyOrders(sku);
    } else {
      setMatchedOrders([]);
    }
  }, [isOpen, sku]);

  const searchHarleyOrders = async (searchSku: string) => {
    if (!searchSku || searchSku.trim() === "") {
      toast.error("Please enter a valid SKU to search");
      return;
    }

    try {
      setIsLoading(true);
      
      // Search the hd_combined view for matching part_number
      const { data, error } = await supabase
        .from('hd_combined')
        .select('hd_order_number, part_number, dealer_po_number, order_quantity, status, hd_orderlinecombo')
        .eq('part_number', searchSku)
        .order('hd_order_number', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      setMatchedOrders(data || []);
    } catch (error: any) {
      console.error("Error searching Harley orders:", error);
      toast.error("Failed to search for Harley orders");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchHarleyOrders(searchTerm);
  };

  const matchToOrder = async (order: HarleyOrderMatch) => {
    try {
      setIsMatching(true);
      
      // Update the progress record with Harley Davidson order info
      const { error } = await supabase
        .from('iron_city_order_progress')
        .update({
          progress: "Ordered",
          hd_orderlinecombo: order.hd_orderlinecombo,
          status: order.status,
          dealer_po_number: order.dealer_po_number,
          notes: `Matched to HD order: ${order.hd_order_number} | ${new Date().toISOString().slice(0, 10)}`
        })
        .eq('shopify_order_id', shopifyOrderId)
        .eq('sku', sku);
        
      if (error) {
        throw error;
      }
      
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
      <DialogContent className="max-w-3xl bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-orange-400">Match to Harley Order</DialogTitle>
          <DialogDescription className="text-zinc-300">
            Search for and match the item ({sku}) to a Harley Davidson order
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSearch} className="flex gap-2 mt-2">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by SKU"
            className="flex-grow bg-zinc-800 border-zinc-700 text-zinc-300"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
            Search
          </Button>
        </form>

        <div className="mt-4 max-h-96 overflow-auto">
          {matchedOrders.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              {isLoading 
                ? "Searching..."
                : "No matching Harley orders found. Try a different search term."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-800/50">
                  <TableHead className="text-zinc-300">Order #</TableHead>
                  <TableHead className="text-zinc-300">Part #</TableHead>
                  <TableHead className="text-zinc-300">PO #</TableHead>
                  <TableHead className="text-zinc-300">Quantity</TableHead>
                  <TableHead className="text-zinc-300">Status</TableHead>
                  <TableHead className="text-zinc-300"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matchedOrders.map((order, index) => (
                  <TableRow key={`${order.hd_order_number}-${index}`} className="hover:bg-zinc-800/30 border-zinc-800/30">
                    <TableCell className="text-zinc-300">{order.hd_order_number}</TableCell>
                    <TableCell className="text-zinc-300">{order.part_number}</TableCell>
                    <TableCell className="text-zinc-300">{order.dealer_po_number || "N/A"}</TableCell>
                    <TableCell className="text-zinc-300">{order.order_quantity || "N/A"}</TableCell>
                    <TableCell className="text-zinc-300">{order.status || "N/A"}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => matchToOrder(order)}
                        disabled={isMatching}
                      >
                        {isMatching ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          "Match"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
