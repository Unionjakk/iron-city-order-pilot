
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import PicklistTable from "./components/PicklistTable";
import PicklistFilter from "./components/PicklistFilter";
import PicklistLoading from "./components/PicklistLoading";
import { usePicklistData } from "./hooks/usePicklistData";
import { Package, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";

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
          <h1 className="text-2xl font-bold text-orange-500">To Pick</h1>
          <p className="text-orange-400/80">Manage your picking list</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleDebug}
          className="flex items-center gap-1"
        >
          <Bug className="h-4 w-4" />
          {showDebug ? 'Hide Debug' : 'Show Debug'}
        </Button>
      </div>
      
      {showDebug && !isLoading && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300">Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="text-xs font-mono overflow-x-auto">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Picklist Dashboard</CardTitle>
          <CardDescription>
            Report filtered to show Leeds Iron City Motorcycles (ID 53277786267) fresh unfulfilled orders that have not had any progression
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <PicklistLoading />
          ) : orders.length === 0 ? (
            <div className="p-6 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-2 text-lg font-semibold">No orders to pick</h3>
              <p className="text-muted-foreground">
                {debugInfo.lineItemCount === 0 ? 
                  "No items found at Leeds Iron City Motorcycles location (ID: 53277786267)." :
                  "All items for Leeds Iron City Motorcycles have already been processed."}
              </p>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={refreshData}
              >
                Refresh Data
              </Button>
            </div>
          ) : (
            <>
              <PicklistFilter />
              <PicklistTable 
                orders={orders}
                refreshData={refreshData}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PicklistPage;
