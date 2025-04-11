
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import PicklistTable from "./components/PicklistTable";
import PicklistFilter from "./components/PicklistFilter";
import PicklistLoading from "./components/PicklistLoading";
import { usePicklistData } from "./hooks/usePicklistData";
import { Package, RefreshCcw, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
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
          <h1 className="page-title">To Pick</h1>
          <p className="page-description">Manage your picking list for Leeds Iron City Motorcycles</p>
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
          <CardTitle className="text-orange-500">Picklist Dashboard</CardTitle>
          <CardDescription className="text-zinc-400">
            Report filtered to show Leeds Iron City Motorcycles fresh unfulfilled orders that have not had any progression
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <PicklistLoading />
          ) : orders.length === 0 ? (
            <div className="p-10 text-center">
              <Package className="mx-auto h-16 w-16 text-orange-500/50" />
              <h3 className="mt-6 text-xl font-semibold text-orange-500">No orders to pick</h3>
              <p className="mt-2 text-zinc-400 max-w-md mx-auto">
                {debugInfo.lineItemCount === 0 ? 
                  "No items found at Leeds Iron City Motorcycles location (ID: 53277786267)." :
                  "All items for Leeds Iron City Motorcycles have already been processed."}
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

export default PicklistPage;
