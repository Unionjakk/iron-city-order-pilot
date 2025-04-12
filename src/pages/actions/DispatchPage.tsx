
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Package, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import PicklistFilter from "./components/PicklistFilter";
import DispatchTable from "./components/DispatchTable";
import PicklistLoading from "./components/PicklistLoading";
import { useDispatchData } from "./hooks/useDispatchData";

const DispatchPage = () => {
  const { orders, isLoading, error, refreshData, debugInfo } = useDispatchData();
  const [showDebug, setShowDebug] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredOrders, setFilteredOrders] = useState(orders);
  const { toast } = useToast();

  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading dispatch data",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Filter orders based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrders(orders);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = orders.filter(order => {
      // Search in order number
      if (order.shopify_order_number?.toLowerCase().includes(query)) {
        return true;
      }
      
      // Search in order ID if no order number
      if (!order.shopify_order_number && order.shopify_order_id.toLowerCase().includes(query)) {
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const toggleDebug = () => setShowDebug(prev => !prev);

  return (
    <div className="space-y-6">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="page-title">To Dispatch</h1>
          <p className="page-description">View all orders ready for dispatch for Leeds Iron City Motorcycles</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData}
            className="button-outline"
          >
            <RefreshCcw className="h-4 w-4 mr-1" />
            Refresh Data
          </Button>
        </div>
      </div>
      
      <Card className="card-styled">
        <CardHeader className="bg-zinc-800/50 rounded-t-lg border-b border-zinc-700/50">
          <CardTitle className="text-blue-500">Dispatch Dashboard</CardTitle>
          <CardDescription className="text-zinc-400">
            Orders that are fully picked and ready for dispatch
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <PicklistLoading />
          ) : filteredOrders.length === 0 && !searchQuery ? (
            <div className="p-10 text-center">
              <Package className="mx-auto h-16 w-16 text-blue-500/50" />
              <h3 className="mt-6 text-xl font-semibold text-blue-500">No orders ready for dispatch</h3>
              <p className="mt-2 text-zinc-400 max-w-md mx-auto">
                No orders have been marked as ready for dispatch yet.
              </p>
              <Button 
                variant="outline" 
                className="mt-6 button-outline" 
                onClick={refreshData}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh Data
              </Button>
            </div>
          ) : (
            <>
              <div className="p-4 bg-zinc-800/20">
                <PicklistFilter onSearch={handleSearch} />
              </div>
              
              {filteredOrders.length === 0 && searchQuery ? (
                <div className="p-10 text-center">
                  <h3 className="text-xl font-semibold text-blue-500">No matching dispatch orders found</h3>
                  <p className="mt-2 text-zinc-400 max-w-md mx-auto">
                    No dispatch-ready orders match your search for "{searchQuery}".
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
                <DispatchTable 
                  orders={filteredOrders}
                  refreshData={refreshData}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-8">
        <Collapsible
          open={showDebug}
          className="border border-zinc-800 rounded-lg overflow-hidden"
        >
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full flex justify-between items-center p-3 h-auto text-sm bg-zinc-900/80"
              onClick={toggleDebug}
            >
              <div className="flex items-center gap-2 text-zinc-400">
                {showDebug ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span>{showDebug ? "Hide Debug Information" : "Show Debug Information"}</span>
              </div>
              {showDebug ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {debugInfo && (
              <div className="bg-zinc-900 p-4 text-sm">
                <div className="mb-2 text-blue-400">
                  Search Results: {filteredOrders.length} of {orders.length} orders
                </div>
                <pre className="text-xs overflow-auto max-h-96 text-zinc-400 font-mono">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default DispatchPage;
