
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import { useState, useEffect } from 'react';
import DebugInfoPanel from './DebugInfoPanel';
import RefreshButton from './RefreshButton';
import { useCompleteRefresh } from './hooks/useCompleteRefresh';

interface CompleteRefreshProps {
  onRefreshComplete: () => Promise<void>;
  onRefreshStatusChange?: (isRefreshing: boolean) => void;
}

const CompleteRefresh = ({ onRefreshComplete, onRefreshStatusChange }: CompleteRefreshProps) => {
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  const {
    isDeleting,
    isImporting,
    isSuccess,
    isBackgroundProcessing,
    debugInfo,
    error,
    orderCounts,
    handleCompleteRefresh,
    resetState
  } = useCompleteRefresh({ onRefreshComplete });

  // Notify parent when refresh status changes
  useEffect(() => {
    const isRefreshing = isDeleting || isImporting || isBackgroundProcessing;
    if (onRefreshStatusChange) {
      onRefreshStatusChange(isRefreshing);
    }
  }, [isDeleting, isImporting, isBackgroundProcessing, onRefreshStatusChange]);

  // Show count mismatch warning if appropriate
  const hasCountMismatch = orderCounts.expected > 0 && 
                          orderCounts.imported > 0 && 
                          orderCounts.expected !== orderCounts.imported;
  
  return (
    <Card className="bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-xl">Complete Data Refresh</CardTitle>
        <CardDescription>
          Complete data refresh will delete ALL existing Shopify orders and import 
          ONLY <span className="text-yellow-500">ACTIVE UNFULFILLED and PARTIALLY FULFILLED</span> orders.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isBackgroundProcessing && (
          <Alert variant="warning" className="bg-amber-800/20 border-amber-500/50">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle>Import Processing in Background</AlertTitle>
            <AlertDescription>
              The import operation is taking longer than expected and is continuing to run in the background.
              You can leave this page and check back later. Do not start another import until this completes.
              {orderCounts.expected > 0 && (
                <div className="mt-2 text-sm">
                  <span className="font-medium">Expected to import:</span> {orderCounts.expected} orders 
                  ({orderCounts.unfulfilled} unfulfilled, {orderCounts.partiallyFulfilled} partially fulfilled)
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {hasCountMismatch && (
          <Alert variant="warning" className="bg-amber-800/20 border-amber-500/50">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle>Import Count Mismatch</AlertTitle>
            <AlertDescription>
              Expected to import {orderCounts.expected} orders but only imported {orderCounts.imported}.
              There may be {orderCounts.expected - orderCounts.imported} orders missing.
              Check the debug info for more details.
            </AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive" className="bg-red-800/20 border-red-500/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Import Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Alert className="bg-zinc-800/50 border-zinc-700/50">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <p className="text-sm text-zinc-300">
              This operation will <span className="text-red-400 font-bold">delete ALL existing Shopify orders</span> from the database 
              and import <span className="text-yellow-500 font-bold">ONLY ACTIVE UNFULFILLED and PARTIALLY FULFILLED</span> orders.
              This is a complete refresh and should only be used when needed.
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Note: Only unfulfilled and partially fulfilled orders that are not cancelled 
              or archived will be imported. This helps maintain a clean database.
            </p>
          </AlertDescription>
        </Alert>
        
        {/* Order Count Information */}
        {(isSuccess || isBackgroundProcessing) && orderCounts.expected > 0 && (
          <div className="bg-zinc-800/50 rounded p-3 text-sm">
            <h4 className="font-medium text-zinc-300 mb-1">Import Statistics</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-zinc-400">Expected Total:</span>
                <span className="ml-2 text-zinc-200">{orderCounts.expected}</span>
              </div>
              <div>
                <span className="text-zinc-400">Imported:</span>
                <span className="ml-2 text-zinc-200">{orderCounts.imported}</span>
              </div>
              <div>
                <span className="text-zinc-400">Unfulfilled Orders:</span>
                <span className="ml-2 text-zinc-200">{orderCounts.unfulfilled}</span>
              </div>
              <div>
                <span className="text-zinc-400">Partially Fulfilled:</span>
                <span className="ml-2 text-zinc-200">{orderCounts.partiallyFulfilled}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Toggle Debug Info Button */}
        <button 
          onClick={() => setShowDebugInfo(!showDebugInfo)}
          className="text-xs text-zinc-500 hover:text-zinc-300 underline"
        >
          {showDebugInfo ? 'Hide Debug Info' : 'Show Debug Info'}
        </button>
        
        {/* Debug Info Panel - only shown when toggled */}
        {showDebugInfo && debugInfo.length > 0 && (
          <DebugInfoPanel debugInfo={debugInfo} />
        )}
      </CardContent>
      <CardFooter>
        <RefreshButton 
          isDeleting={isDeleting} 
          isImporting={isImporting} 
          isBackgroundProcessing={isBackgroundProcessing}
          isSuccess={isSuccess}
          orderCounts={orderCounts}
          onClick={handleCompleteRefresh} 
        />
      </CardFooter>
    </Card>
  );
};

export default CompleteRefresh;
