
import { useState, useEffect } from "react";
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
import { Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PinnacleSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sku: string;
  shopifyOrderNumber: string;
  quantity: number;
  onItemSelected: (item: any) => void;
}

const PinnacleSearchDialog: React.FC<PinnacleSearchDialogProps> = ({
  isOpen,
  onClose,
  sku,
  shopifyOrderNumber,
  quantity,
  onItemSelected
}) => {
  const [searchQuery, setSearchQuery] = useState(sku);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Search for stock when dialog opens with the current SKU
  useEffect(() => {
    if (isOpen && sku) {
      performSearch(sku);
    }
  }, [isOpen, sku]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  // Perform the search
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      toast({
        title: "Input required",
        description: "Please enter a search term",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pinnacle_stock_view')
        .select('corrected_sku, description, bin_location, stock_quantity, cost, part_no')
        .or(`corrected_sku.ilike.%${query}%,description.ilike.%${query}%`);

      if (error) throw error;
      
      setResults(data || []);
      
      if (data?.length === 0) {
        toast({
          title: "No results found",
          description: "Try a different search term",
        });
      }
    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-orange-400">Manually select a part from Pinnacle database</DialogTitle>
          <DialogDescription className="text-zinc-300">
            Search for and match the SKU to the Pinnacle Database
          </DialogDescription>
        </DialogHeader>
        
        {/* Order Info */}
        <div className="bg-zinc-800/50 p-3 rounded-md mb-4">
          <div className="flex flex-col space-y-1 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            <div className="flex items-center">
              <span className="text-orange-400 font-medium mr-1">SKU:</span>
              <span className="text-zinc-300">{sku}</span>
            </div>
            <div className="flex items-center">
              <span className="text-orange-400 font-medium mr-1">Order:</span>
              <span className="text-zinc-300">{shopifyOrderNumber}</span>
            </div>
            <div className="flex items-center">
              <span className="text-orange-400 font-medium mr-1">Quantity Required:</span>
              <span className="text-orange-500 font-bold">{quantity}</span>
            </div>
          </div>
        </div>
        
        {/* Search Form */}
        <form onSubmit={handleSearch} className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
          <Input
            type="text"
            placeholder="Search by part number or description..."
            className="pl-10 pr-10 bg-zinc-800/30 border-zinc-700 focus:border-orange-500 text-zinc-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-10 top-1.5 h-7 w-7 text-zinc-500 hover:text-zinc-300"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button 
            type="submit"

            className="absolute right-1 top-1 h-8"
            size="sm"
            disabled={isLoading}
          >
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </form>
        
        {/* Results Table */}
        <div className="max-h-96 overflow-auto mb-4">
          <table className="w-full border-collapse">
            <thead className="bg-zinc-800/50">
              <tr className="text-left">
                <th className="p-2 font-medium text-orange-400">Part Number</th>
                <th className="p-2 font-medium text-orange-400">Description</th>
                <th className="p-2 font-medium text-orange-400">Bin Location</th>
                <th className="p-2 font-medium text-orange-400">Stock</th>
                <th className="p-2 font-medium text-orange-400">Cost</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {results.map((item, index) => (
                <tr
                  key={index}
                  className="border-t border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="p-2 text-zinc-300">{item.corrected_sku}</td>
                  <td className="p-2 text-zinc-300">{item.description}</td>
                  <td className="p-2 text-zinc-300">{item.bin_location || 'N/A'}</td>
                  <td className="p-2 text-zinc-300">{item.stock_quantity !== null ? item.stock_quantity : 'N/A'}</td>
                  <td className="p-2 text-zinc-300">{item.cost !== null ? `£${item.cost.toFixed(2)}` : 'N/A'}</td>
                  <td className="p-2">
                    <Button
                      size="sm"
                      onClick={() => onItemSelected(item)}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      Match
                    </Button>
                  </td>
                </tr>
              ))}
              {results.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-zinc-500">
                    No results found. Try a different search term.
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-zinc-500">
                    Searching...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PinnacleSearchDialog;
