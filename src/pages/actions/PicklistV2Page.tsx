
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Printer, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PicklistSearch from "./components/picklist-v2/PicklistSearch";
import PicklistOrdersList from "./components/picklist-v2/PicklistOrdersList";
import PicklistLoading from "./components/PicklistLoading";
import { ExternalLink } from "lucide-react";

// Define interfaces for our data
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

// Group items by order
interface PicklistOrder {
  shopify_order_number: string;
  order_id: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  items: PicklistItem[];
}

const PicklistV2Page = () => {
  const [orders, setOrders] = useState<PicklistOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PicklistOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const printFrameRef = useRef<HTMLIFrameElement>(null);

  // Fetch data from iron_city_action_viewer
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get items where iron_progress is null (items to pick)
      const { data, error } = await supabase
        .from('iron_city_action_viewer')
        .select('*')
        .is('iron_progress', null);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        setOrders([]);
        setFilteredOrders([]);
        setIsLoading(false);
        return;
      }
      
      // Group items by order
      const orderMap = new Map<string, PicklistOrder>();
      
      data.forEach((item: any) => {
        const orderNumber = item.shopify_order_number;
        
        if (!orderMap.has(orderNumber)) {
          orderMap.set(orderNumber, {
            shopify_order_number: orderNumber,
            order_id: item.order_id,
            created_at: item.created_at,
            customer_name: item.customer_name || "Unknown Customer",
            customer_email: item.customer_email || "",
            items: []
          });
        }
        
        orderMap.get(orderNumber)?.items.push({
          id: item.id,
          order_id: item.order_id,
          shopify_order_number: orderNumber,
          created_at: item.created_at,
          customer_name: item.customer_name || "Unknown Customer",
          customer_email: item.customer_email || "",
          sku: item.sku || "No SKU",
          title: item.title || "Unknown Item",
          quantity: item.quantity || 1,
          price: item.price,
          price_ex_vat: item.price_ex_vat,
          pinnacle_stock_quantity: item.pinnacle_stock_quantity,
          pinnacle_description: item.pinnacle_description,
          pinnacle_bin_location: item.pinnacle_bin_location,
          pinnacle_cost: item.pinnacle_cost,
          pinnacle_part_number: item.pinnacle_part_number
        });
      });
      
      // Convert map to array and sort by order number
      const ordersList = Array.from(orderMap.values())
        .sort((a, b) => a.shopify_order_number.localeCompare(b.shopify_order_number));
      
      setOrders(ordersList);
      setFilteredOrders(ordersList);
    } catch (err: any) {
      console.error("Error fetching picklist data:", err);
      setError(err.message);
      toast({
        title: "Error loading picklist data",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);
  
  // Filter orders based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrders(orders);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtered = orders.filter(order => {
      // Search in order number
      if (order.shopify_order_number.toLowerCase().includes(query)) {
        return true;
      }
      
      // Search in customer information
      if (order.customer_name.toLowerCase().includes(query)) {
        return true;
      }
      
      if (order.customer_email?.toLowerCase().includes(query)) {
        return true;
      }
      
      // Search in order items
      return order.items.some(item => 
        item.sku?.toLowerCase().includes(query) || 
        item.title.toLowerCase().includes(query)
      );
    });
    
    setFilteredOrders(filtered);
  }, [searchQuery, orders]);
  
  // Handle search query change
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  // Print function
  const handlePrint = () => {
    // Create printable content
    const printableOrders = orders.filter(order => 
      order.items.some(item => item.pinnacle_stock_quantity !== null && item.pinnacle_stock_quantity > 0)
    );
    
    // Create print content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pick List - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            .order { margin-bottom: 20px; break-inside: avoid; }
            .order-header { background: #f3f4f6; padding: 8px; border-bottom: 1px solid #e5e7eb; }
            .order-items { width: 100%; border-collapse: collapse; }
            .order-items th { text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb; }
            .order-items td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
            .stock-info { color: #16a34a; }
            @media print {
              body { font-size: 12px; }
              .no-print { display: none; }
              .page-break { page-break-after: always; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px;">
            <button onclick="window.print()">Print</button>
            <button onclick="window.close()">Close</button>
          </div>
          
          <h1>Pick List - ${new Date().toLocaleDateString()}</h1>
          
          ${printableOrders.map(order => `
            <div class="order">
              <div class="order-header">
                <h2>Order: ${order.shopify_order_number}</h2>
                <p>Date: ${new Date(order.created_at).toLocaleDateString()}</p>
                <p>Customer: ${order.customer_name}</p>
              </div>
              
              <table class="order-items">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Stock</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items
                    .filter(item => item.pinnacle_stock_quantity !== null && item.pinnacle_stock_quantity > 0)
                    .map(item => `
                      <tr>
                        <td>${item.sku}</td>
                        <td>${item.title}</td>
                        <td>${item.quantity}</td>
                        <td class="stock-info">${item.pinnacle_stock_quantity || 'N/A'}</td>
                        <td class="stock-info">${item.pinnacle_bin_location || 'N/A'}</td>
                      </tr>
                    `).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}
        </body>
      </html>
    `;
    
    // Open print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      // Let the browser render the content before printing
      setTimeout(() => {
        printWindow.focus();
      }, 500);
    } else {
      toast({
        title: "Print Error",
        description: "Unable to open print window. Please check your popup blocker settings.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-orange-500">To Pick v2.0</h1>
          <p className="text-orange-400/80">View and manage items to be picked for Leeds Iron City Motorcycles</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrint}
            className="button-outline flex items-center"
          >
            <Printer className="h-4 w-4 mr-1" />
            Print Pick List
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            className="button-outline flex items-center"
          >
            <RefreshCcw className="h-4 w-4 mr-1" />
            Refresh Data
          </Button>
        </div>
      </div>
      
      <Card className="card-styled">
        <CardHeader className="bg-zinc-800/50 rounded-t-lg border-b border-zinc-700/50">
          <CardTitle className="text-orange-500">To Pick Dashboard</CardTitle>
          <CardDescription className="text-zinc-400">
            Items that need to be picked for Leeds Iron City Motorcycles
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <PicklistLoading />
          ) : filteredOrders.length === 0 && !searchQuery ? (
            <div className="p-10 text-center">
              <h3 className="mt-6 text-xl font-semibold text-orange-500">No items to pick</h3>
              <p className="mt-2 text-zinc-400 max-w-md mx-auto">
                No items are currently in the "To Pick" status.
              </p>
              <Button 
                variant="outline" 
                className="mt-6 button-outline" 
                onClick={fetchData}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh Data
              </Button>
            </div>
          ) : (
            <>
              <div className="p-4 bg-zinc-800/20">
                <PicklistSearch onSearch={handleSearch} />
              </div>
              
              {filteredOrders.length === 0 && searchQuery ? (
                <div className="p-10 text-center">
                  <h3 className="text-xl font-semibold text-orange-500">No matching items found</h3>
                  <p className="mt-2 text-zinc-400 max-w-md mx-auto">
                    No "To Pick" items match your search for "{searchQuery}".
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-6 button-outline" 
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </Button>
                </div>
              ) : (
                <PicklistOrdersList 
                  orders={filteredOrders}
                  refreshData={fetchData}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Link to the old picklist page */}
      <div className="text-center mt-8 text-sm text-zinc-400">
        <Link to="/actions/oldpicklist" className="flex items-center justify-center hover:text-orange-400 transition-colors">
          <LinkIcon className="h-3 w-3 mr-1" />
          <span>Access previous version</span>
        </Link>
      </div>
      
      {/* Hidden iframe for printing */}
      <iframe ref={printFrameRef} style={{ display: 'none' }} title="Print Frame" />
    </div>
  );
};

export default PicklistV2Page;
