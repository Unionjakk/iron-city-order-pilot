
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
    debugInfo,
    error,
    isBackgroundProcessing,
    expectedOrderCount,
    actualOrderCount,
    unfulfilledCount,
    partialFulfilledCount,
    isDataMismatch,
    handleCompleteRefresh,
    verifyImportCompletion,
    resetState
  } = useCompleteRefresh({ onRefreshComplete });

  // Notify parent when refresh status changes
  useEffect(() => {
    const isRefreshing = isDeleting || isImporting || isBackgroundProcessing;
    if (onRefreshStatusChange) {
      onRefreshStatusChange(isRefreshing);
    }
  }, [isDeleting, isImporting, isBackgroundProcessing, onRefreshStatusChange]);
  
  // Poll for data verification when in background processing mode
  useEffect(() => {
    let verificationInterval: NodeJS.Timeout | null = null;
    
    if (isBackgroundProcessing) {
      verificationInterval = setInterval(() => {
        verifyImportCompletion();
      }, 10000); // Check every 10 seconds
    }
    
    return () => {
      if (verificationInterval) {
        clearInterval(verificationInterval);
      }
    };
  }, [isBackgroundProcessing, verifyImportCompletion]);
  
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
              {isDataMismatch && (
                <p className="mt-2 font-bold">
                  Data verification shows a mismatch: Found {actualOrderCount} of {expectedOrderCount} expected orders.
                  This may indicate the import is still in progress.
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {isDataMismatch && isSuccess && (
          <Alert variant="warning" className="bg-yellow-800/20 border-yellow-500/50">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertTitle>Data Verification Failed</AlertTitle>
            <AlertDescription>
              <p>Expected {expectedOrderCount} total orders but found {actualOrderCount} orders in the database.</p>
              <p>Unfulfilled: {unfulfilledCount}, Partially Fulfilled: {partialFulfilledCount}</p>
              <p className="mt-2">
                This usually indicates the import is still running in the background or encountered issues.
                Wait a few minutes and try refreshing the page, or click the button to retry the operation.
              </p>
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
          isImporting={isImporting || isBackgroundProcessing}
          isSuccess={isSuccess} 
          expectedTotal={expectedOrderCount}
          actualTotal={actualOrderCount}
          unfulfilled={unfulfilledCount}
          partialFulfilled={partialFulfilledCount}
          isMismatch={isDataMismatch}
          onClick={handleCompleteRefresh} 
        />
      </CardFooter>
    </Card>
  );
};

export default CompleteRefresh;
