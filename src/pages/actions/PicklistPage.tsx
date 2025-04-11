
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import PicklistTable from "./components/PicklistTable";
import PicklistFilter from "./components/PicklistFilter";
import PicklistLoading from "./components/PicklistLoading";
import { usePicklistData } from "./hooks/usePicklistData";
import { Package, Bug, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const PicklistPage = () => {
  const { orders, isLoading, error, refreshData, debugInfo } = usePicklistData();
  const [showDebug, setShowDebug] = useState(true); // Default to true to help with troubleshooting
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
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData}
            className="flex items-center gap-1"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh Data
          </Button>
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
      </div>
      
      {showDebug && debugInfo && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300">Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="text-xs font-mono overflow-x-auto">
            <div className="space-y-2">
              <div>
                <h3 className="text-slate-400 mb-1">Orders Data:</h3>
                <p className="text-slate-300">Found {debugInfo.orderCount || 0} orders</p>
                {debugInfo.orderStatus && (
                  <div className="mt-1">
                    <p className="text-slate-400">Sample order statuses:</p>
                    <pre className="whitespace-pre-wrap text-slate-300">
                      {JSON.stringify(debugInfo.orderStatus, null, 2)}
                    </pre>
                  </div>
                )}
                {debugInfo.availableStatuses && (
                  <div className="mt-1">
                    <p className="text-slate-400">Available order statuses:</p>
                    <pre className="whitespace-pre-wrap text-slate-300">
                      {JSON.stringify(debugInfo.availableStatuses, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-slate-400 mb-1">Line Items:</h3>
                <p className="text-slate-300">
                  Found {debugInfo.lineItemCount || 0} line items at Leeds location (ID: 53277786267)
                </p>
                {debugInfo.locationDistribution && (
                  <div className="mt-1">
                    <p className="text-slate-400">Location distribution:</p>
                    <pre className="whitespace-pre-wrap text-slate-300">
                      {JSON.stringify(debugInfo.locationDistribution, null, 2)}
                    </pre>
                  </div>
                )}
                {debugInfo.lineItemsFirstFew && (
                  <div className="mt-1">
                    <p className="text-slate-400">Sample line items:</p>
                    <pre className="whitespace-pre-wrap text-slate-300">
                      {JSON.stringify(debugInfo.lineItemsFirstFew, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-slate-400 mb-1">Progress Data:</h3>
                <p className="text-slate-300">Found {debugInfo.progressItemCount || 0} items with progress data</p>
                {debugInfo.progressItems && (
                  <div className="mt-1">
                    <p className="text-slate-400">Sample progress items:</p>
                    <pre className="whitespace-pre-wrap text-slate-300">
                      {JSON.stringify(debugInfo.progressItems, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-slate-400 mb-1">Final Results:</h3>
                <p className="text-slate-300">
                  Processed {debugInfo.finalOrderCount || 0} orders with {debugInfo.finalItemCount || 0} items
                </p>
              </div>
              
              {debugInfo.error && (
                <div>
                  <h3 className="text-red-400 mb-1">Error:</h3>
                  <p className="text-red-300">{debugInfo.error}</p>
                </div>
              )}
            </div>
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
