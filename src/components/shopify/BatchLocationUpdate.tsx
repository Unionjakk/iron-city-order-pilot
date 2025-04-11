
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Map, Database, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DebugInfoPanel from './DebugInfoPanel';
import { getTokenFromDatabase } from './services/importService';
import { Progress } from '@/components/ui/progress';

interface OrderBatchItem {
  id: string;
  shopify_order_id: string;
  shopify_order_number: string;
}

interface BatchStats {
  requestCount: number;
  successCount: number;
  errorCount: number;
  retryQueue: string[];
}

const BatchLocationUpdate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [processedOrders, setProcessedOrders] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [showDetailedDebug, setShowDetailedDebug] = useState(false);
  const { toast } = useToast();

  // Add debug message
  const addDebugMessage = (message: string) => {
    setDebugInfo(prev => [...prev, message]);
  };

  // Add detailed debug message
  const addDetailedDebug = (message: string) => {
    if (showDetailedDebug) {
      setDebugInfo(prev => [...prev, `DETAIL: ${message}`]);
    }
  };

  // Process a single order - extracted to allow for retries
  const processSingleOrder = async (
    order: OrderBatchItem, 
    token: string, 
    batchStats: BatchStats
  ): Promise<{ success: boolean, orderId: string, details?: string }> => {
    try {
      addDebugMessage(`Updating locations for order ${order.shopify_order_number} (${order.shopify_order_id})`);
      
      // Call the edge function
      const response = await supabase.functions.invoke('shopify-locations-sync', {
        body: { 
          apiToken: token,
          mode: 'batch',
          orderId: order.shopify_order_id,
          includeDebugData: showDetailedDebug
        }
      });

      // If the response has detailed debug info, log it
      if (response.data?.debugData) {
        addDetailedDebug(`API Request: ${response.data.debugData.request || 'N/A'}`);
        addDetailedDebug(`API Response: ${response.data.debugData.response || 'N/A'}`);
      }
      
      if (response.error) {
        addDebugMessage(`❌ Error updating order ${order.shopify_order_number}: ${response.error.message}`);
        return { 
          success: false, 
          orderId: order.shopify_order_id,
          details: response.error.message 
        };
      }
      
      const data = response.data;
      
      if (!data || !data.success) {
        const errorMsg = data?.error || 'Unknown error';
        addDebugMessage(`❌ Failed to update order ${order.shopify_order_number}: ${errorMsg}`);
        return { 
          success: false, 
          orderId: order.shopify_order_id,
          details: errorMsg
        };
      }
      
      addDebugMessage(`✅ Successfully updated ${data.updated || 0} line items for order ${order.shopify_order_number}`);
      return { 
        success: true, 
        orderId: order.shopify_order_id,
        details: `Updated ${data.updated || 0} line items`
      };
    } catch (err: any) {
      addDebugMessage(`❌ Exception processing order ${order.shopify_order_number}: ${err.message}`);
      return { 
        success: false, 
        orderId: order.shopify_order_id,
        details: err.message
      };
    }
  };

  // Process a batch of orders
  const processBatch = async (
    batch: OrderBatchItem[], 
    token: string, 
    batchNumber: number,
    totalBatches: number,
    batchStats: BatchStats
  ) => {
    addDebugMessage(`Processing batch ${batchNumber} of ${totalBatches} (${batch.length} orders)`);
    
    // Process each order in the batch concurrently
    const batchPromises = batch.map(order => processSingleOrder(order, token, batchStats));
    const batchResults = await Promise.all(batchPromises);
    
    // Update statistics
    const batchSuccessCount = batchResults.filter(r => r.success).length;
    const batchErrorCount = batchResults.filter(r => !r.success).length;
    
    // Identify orders that failed and should be retried
    const failedOrderIds = batchResults
      .filter(r => !r.success)
      .map(r => r.orderId);
    
    // Update global stats
    batchStats.successCount += batchSuccessCount;
    batchStats.errorCount += batchErrorCount;
    batchStats.requestCount += batch.length;
    batchStats.retryQueue.push(...failedOrderIds);
    
    // Update UI counters
    setSuccessCount(batchStats.successCount);
    setErrorCount(batchStats.errorCount);
    
    // Update progress based on total processed, not just successful ones
    const newProcessedCount = batchStats.requestCount;
    setProcessedOrders(newProcessedCount);
    
    // Calculate progress as a percentage of total orders to process
    const calculatedProgress = Math.round((newProcessedCount / totalOrders) * 100);
    setProgress(Math.min(calculatedProgress, 99)); // Cap at 99% until completely done
    
    addDebugMessage(`Batch ${batchNumber} complete: ${batchSuccessCount} successful, ${batchErrorCount} failed`);
  };

  // Handle retry of failed orders
  const processRetries = async (
    ordersList: OrderBatchItem[],
    retryOrderIds: string[],
    token: string,
    batchStats: BatchStats
  ) => {
    if (retryOrderIds.length === 0) {
      addDebugMessage("No orders to retry");
      return;
    }
    
    addDebugMessage(`Attempting to retry ${retryOrderIds.length} failed orders...`);
    
    // Filter the order list to only include the ones we want to retry
    const ordersToRetry = ordersList.filter(order => 
      retryOrderIds.includes(order.shopify_order_id)
    );
    
    // Clear the retry queue
    batchStats.retryQueue = [];
    
    // Set batch size for retry processing
    const retryBatchSize = 5;
    
    for (let i = 0; i < ordersToRetry.length; i += retryBatchSize) {
      const retryBatch = ordersToRetry.slice(i, i + retryBatchSize);
      
      addDebugMessage(`Retrying batch ${Math.floor(i/retryBatchSize) + 1} of ${Math.ceil(ordersToRetry.length/retryBatchSize)}`);
      
      // Process each order in the retry batch sequentially to maximize success
      for (const order of retryBatch) {
        const result = await processSingleOrder(order, token, batchStats);
        
        if (result.success) {
          batchStats.successCount++;
          batchStats.errorCount--;
          setSuccessCount(batchStats.successCount);
          setErrorCount(batchStats.errorCount);
        }
      }
      
      // Add a longer delay between retry batches
      if (i + retryBatchSize < ordersToRetry.length) {
        addDebugMessage(`Waiting 3 seconds before next retry batch...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    addDebugMessage(`Retry process complete. Final counts: ${batchStats.successCount} successful, ${batchStats.errorCount} failed`);
  };

  // Handle batch update
  const handleBatchUpdate = async () => {
    setIsLoading(true);
    setError(null);
    setDebugInfo([]);
    setProgress(0);
    setProcessedOrders(0);
    setSuccessCount(0);
    setErrorCount(0);
    
    const batchStats: BatchStats = {
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      retryQueue: []
    };
    
    try {
      addDebugMessage("Starting batch location update for all orders...");
      
      // Get API token
      const token = await getTokenFromDatabase();
      
      if (!token) {
        throw new Error("No API token found in database. Please add your Shopify API token first.");
      }
      
      addDebugMessage("API token retrieved from database");
      
      // Fetch all order IDs from database
      addDebugMessage("Fetching all order IDs from database...");
      
      const { data: orders, error: fetchError } = await supabase
        .from('shopify_orders')
        .select('id, shopify_order_id, shopify_order_number')
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        throw new Error(`Failed to fetch orders: ${fetchError.message}`);
      }
      
      if (!orders || orders.length === 0) {
        addDebugMessage("No orders found in database");
        throw new Error("No orders found in database");
      }
      
      const ordersList = orders as OrderBatchItem[];
      const totalOrdersCount = ordersList.length;
      
      addDebugMessage(`Found ${totalOrdersCount} orders to process`);
      setTotalOrders(totalOrdersCount);
      
      // Process orders in batches to respect rate limits
      // Optimized: Balanced batch size and delay to maximize throughput
      // while staying under Shopify's rate limits
      const batchSize = 5; // Process 5 orders at a time 
      const delayBetweenBatches = 5000; // 5 seconds delay between batches to prevent rate limiting
      
      addDebugMessage(`Using settings: ${batchSize} orders per batch with ${delayBetweenBatches/1000}s delay between batches`);
      
      const totalBatches = Math.ceil(ordersList.length / batchSize);
      
      for (let i = 0; i < ordersList.length; i += batchSize) {
        const batch = ordersList.slice(i, i + batchSize);
        const batchNumber = Math.floor(i/batchSize) + 1;
        
        await processBatch(batch, token, batchNumber, totalBatches, batchStats);
        
        // If we have more batches to process, add delay to respect API rate limits
        if (i + batchSize < ordersList.length) {
          addDebugMessage(`Waiting ${delayBetweenBatches/1000} seconds before next batch to respect API rate limits...`);
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      }
      
      // After processing all batches, try to retry failed requests if any
      if (batchStats.retryQueue.length > 0) {
        addDebugMessage(`Initial processing complete. Now attempting to retry ${batchStats.retryQueue.length} failed orders...`);
        
        // Wait a bit longer before starting retries to let rate limits reset
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        await processRetries(ordersList, batchStats.retryQueue, token, batchStats);
      }
      
      setProgress(100); // Set to 100% when completely done
      
      addDebugMessage(`Batch location update completed`);
      addDebugMessage(`Summary: Processed ${processedOrders} orders, Successfully updated ${batchStats.successCount} orders, Failed ${batchStats.errorCount} orders`);
      
      toast({
        title: "Batch Update Complete",
        description: `Processed ${totalOrdersCount} orders (${batchStats.successCount} successful, ${batchStats.errorCount} failed)`,
        variant: batchStats.errorCount > 0 ? "destructive" : "default",
      });
      
    } catch (error: any) {
      console.error('Error in batch location update:', error);
      setError(error.message || 'Unknown error during batch update');
      setDebugInfo(prev => [...prev, `ERROR: ${error.message || 'Unknown error'}`]);
      
      toast({
        title: "Batch Update Failed",
        description: "Failed to complete the batch location update. See error details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm mt-4">
      <CardHeader>
        <CardTitle className="text-purple-500 flex items-center">
          <Database className="mr-2 h-5 w-5" /> Batch Location Update
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Update location information for all orders in the database (optimized for Shopify's rate limits)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-2">
          <Button 
            onClick={handleBatchUpdate} 
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Map className="mr-2 h-4 w-4 animate-pulse" />
                Updating Locations ({processedOrders}/{totalOrders})...
              </>
            ) : (
              <>
                <Map className="mr-2 h-4 w-4" />
                Update All Orders Location Information
              </>
            )}
          </Button>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showDetailedDebug"
              checked={showDetailedDebug}
              onChange={(e) => setShowDetailedDebug(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="showDetailedDebug" className="text-xs text-zinc-400">
              Show detailed API request/response debug info
            </label>
          </div>
        </div>
        
        {isLoading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Progress: {processedOrders}/{totalOrders} orders</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-md text-sm text-red-300 flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {(successCount > 0 || errorCount > 0) && (
          <div className="flex space-x-4 text-sm">
            <div className="p-2 bg-green-900/20 border border-green-500/50 rounded-md text-green-300 flex-1 text-center">
              <div className="font-semibold">{successCount}</div>
              <div>Orders updated</div>
            </div>
            <div className="p-2 bg-red-900/20 border border-red-500/50 rounded-md text-red-300 flex-1 text-center">
              <div className="font-semibold">{errorCount}</div>
              <div>Orders failed</div>
            </div>
          </div>
        )}
        
        <DebugInfoPanel debugInfo={debugInfo} />
      </CardContent>
    </Card>
  );
};

export default BatchLocationUpdate;
