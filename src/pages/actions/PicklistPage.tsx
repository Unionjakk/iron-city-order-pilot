
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import PicklistTable from "./components/PicklistTable";
import PicklistFilter from "./components/PicklistFilter";
import PicklistLoading from "./components/PicklistLoading";
import { usePicklistData } from "./hooks/usePicklistData";
import { Package, Bug, RefreshCcw, ChevronDown, ChevronUp, Info, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

const PicklistPage = () => {
  const { orders, isLoading, error, refreshData, debugInfo } = usePicklistData();
  const [showDebug, setShowDebug] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading picklist data",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const toggleDebug = () => setShowDebug(prev => !prev);

  return (
    <div className="space-y-6">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-purple-500">To Pick</h1>
          <p className="text-purple-400/80">Manage your picking list for Leeds Iron City Motorcycles</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData}
            className="flex items-center gap-1 border-purple-700 text-purple-400 hover:bg-purple-900/30 hover:text-purple-300"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </div>
      
      <Card className="border-purple-900/50 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader className="bg-purple-900/30 rounded-t-lg border-b border-purple-800/30">
          <CardTitle className="text-purple-300">Picklist Dashboard</CardTitle>
          <CardDescription className="text-purple-200/70">
            Report filtered to show Leeds Iron City Motorcycles (ID 53277786267) fresh unfulfilled orders that have not had any progression
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <PicklistLoading />
          ) : orders.length === 0 ? (
            <div className="p-10 text-center">
              <Package className="mx-auto h-16 w-16 text-purple-500/50" />
              <h3 className="mt-6 text-xl font-semibold text-purple-300">No orders to pick</h3>
              <p className="mt-2 text-purple-200/70 max-w-md mx-auto">
                {debugInfo.lineItemCount === 0 ? 
                  "No items found at Leeds Iron City Motorcycles location (ID: 53277786267)." :
                  "All items for Leeds Iron City Motorcycles have already been processed."}
              </p>
              <Button 
                variant="outline" 
                className="mt-6 border-purple-700 text-purple-400 hover:bg-purple-900/30 hover:text-purple-300" 
                onClick={refreshData}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh Data
              </Button>
            </div>
          ) : (
            <>
              <div className="p-4 bg-purple-900/20">
                <PicklistFilter />
              </div>
              <PicklistTable 
                orders={orders}
                refreshData={refreshData}
              />
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
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-purple-400 font-medium">
                      <Info className="h-4 w-4" />
                      <h3>Orders Data</h3>
                    </div>
                    <Separator className="bg-zinc-800" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                      <div className="bg-zinc-800/30 p-3 rounded border border-zinc-800">
                        <p className="text-zinc-400 text-xs mb-1">Total Orders Found:</p>
                        <p className="text-purple-300 font-mono">{debugInfo.orderCount || 0} orders</p>
                      </div>
                      
                      {debugInfo.orderStatus && debugInfo.orderStatus.length > 0 && (
                        <div className="bg-zinc-800/30 p-3 rounded border border-zinc-800">
                          <p className="text-zinc-400 text-xs mb-1">Sample Order Statuses:</p>
                          <pre className="text-xs overflow-auto max-h-24 text-purple-200/70 font-mono">
                            {JSON.stringify(debugInfo.orderStatus, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {debugInfo.availableStatuses && (
                        <div className="bg-zinc-800/30 p-3 rounded border border-zinc-800">
                          <p className="text-zinc-400 text-xs mb-1">Available Order Statuses:</p>
                          <pre className="text-xs overflow-auto max-h-24 text-purple-200/70 font-mono">
                            {JSON.stringify(debugInfo.availableStatuses, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-purple-400 font-medium">
                      <Info className="h-4 w-4" />
                      <h3>Line Items</h3>
                    </div>
                    <Separator className="bg-zinc-800" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                      <div className="bg-zinc-800/30 p-3 rounded border border-zinc-800">
                        <p className="text-zinc-400 text-xs mb-1">Total Line Items:</p>
                        <p className="text-purple-300 font-mono">
                          {debugInfo.lineItemCount || 0} line items at Leeds location (ID: 53277786267)
                        </p>
                      </div>
                      
                      {debugInfo.locationDistribution && (
                        <div className="bg-zinc-800/30 p-3 rounded border border-zinc-800">
                          <p className="text-zinc-400 text-xs mb-1">Location Distribution:</p>
                          <pre className="text-xs overflow-auto max-h-24 text-purple-200/70 font-mono">
                            {JSON.stringify(debugInfo.locationDistribution, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {debugInfo.lineItemsFirstFew && (
                        <div className="bg-zinc-800/30 p-3 rounded border border-zinc-800 col-span-1 md:col-span-2">
                          <p className="text-zinc-400 text-xs mb-1">Sample Line Items:</p>
                          <pre className="text-xs overflow-auto max-h-24 text-purple-200/70 font-mono">
                            {JSON.stringify(debugInfo.lineItemsFirstFew, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-purple-400 font-medium">
                      <Info className="h-4 w-4" />
                      <h3>Progress Data</h3>
                    </div>
                    <Separator className="bg-zinc-800" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                      <div className="bg-zinc-800/30 p-3 rounded border border-zinc-800">
                        <p className="text-zinc-400 text-xs mb-1">Progress Items:</p>
                        <p className="text-purple-300 font-mono">
                          Found {debugInfo.progressItemCount || 0} items with progress data
                        </p>
                      </div>
                      
                      {debugInfo.progressItems && (
                        <div className="bg-zinc-800/30 p-3 rounded border border-zinc-800 col-span-1 md:col-span-2">
                          <p className="text-zinc-400 text-xs mb-1">Sample Progress Items:</p>
                          <pre className="text-xs overflow-auto max-h-24 text-purple-200/70 font-mono">
                            {JSON.stringify(debugInfo.progressItems, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-purple-400 font-medium">
                      <Info className="h-4 w-4" />
                      <h3>Final Results</h3>
                    </div>
                    <Separator className="bg-zinc-800" />
                    <div className="grid grid-cols-1 gap-4 pl-6">
                      <div className="bg-zinc-800/30 p-3 rounded border border-zinc-800">
                        <p className="text-zinc-400 text-xs mb-1">Processed Orders:</p>
                        <p className="text-purple-300 font-mono">
                          Processed {debugInfo.finalOrderCount || 0} orders with {debugInfo.finalItemCount || 0} items
                        </p>
                      </div>
                      
                      {debugInfo.error && (
                        <div className="bg-red-900/20 p-3 rounded border border-red-800">
                          <p className="text-red-400 text-xs mb-1">Error:</p>
                          <p className="text-red-300 font-mono">{debugInfo.error}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default PicklistPage;
