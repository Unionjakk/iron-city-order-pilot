
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Map, Database } from 'lucide-react';
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

const BatchLocationUpdate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [processedOrders, setProcessedOrders] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const { toast } = useToast();

  // Add debug message
  const addDebugMessage = (message: string) => {
    setDebugInfo(prev => [...prev, message]);
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
      const batchSize = 5; // Process 5 orders at a time to respect 40 requests/minute limit
      const delayBetweenBatches = 10000; // 10 seconds delay between batches (5 orders × 10 seconds = 30 requests/minute)
      
      for (let i = 0; i < ordersList.length; i += batchSize) {
        const batch = ordersList.slice(i, i + batchSize);
        addDebugMessage(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(ordersList.length/batchSize)}`);
        
        // Process each order in the batch concurrently
        const batchResults = await Promise.all(
          batch.map(async (order) => {
            try {
              addDebugMessage(`Updating locations for order ${order.shopify_order_number} (${order.shopify_order_id})`);
              
              const response = await supabase.functions.invoke('shopify-locations-sync', {
                body: { 
                  apiToken: token,
                  mode: 'batch',
                  orderId: order.shopify_order_id
                }
              });
              
              if (response.error) {
                addDebugMessage(`Error updating order ${order.shopify_order_number}: ${response.error.message}`);
                return { success: false, order, error: response.error };
              }
              
              const data = response.data;
              
              if (!data || !data.success) {
                const errorMsg = data?.error || 'Unknown error';
                addDebugMessage(`Failed to update order ${order.shopify_order_number}: ${errorMsg}`);
                return { success: false, order, error: errorMsg };
              }
              
              addDebugMessage(`Successfully updated ${data.updated || 0} line items for order ${order.shopify_order_number}`);
              return { success: true, order, updated: data.updated || 0 };
            } catch (err: any) {
              addDebugMessage(`Exception processing order ${order.shopify_order_number}: ${err.message}`);
              return { success: false, order, error: err.message };
            }
          })
        );
        
        // Update progress
        const newProcessedCount = processedOrders + batch.length;
        setProcessedOrders(newProcessedCount);
        setProgress(Math.round((newProcessedCount / totalOrdersCount) * 100));
        
        // Update success/error counts
        const batchSuccessCount = batchResults.filter(r => r.success).length;
        const batchErrorCount = batchResults.filter(r => !r.success).length;
        
        setSuccessCount(prev => prev + batchSuccessCount);
        setErrorCount(prev => prev + batchErrorCount);
        
        // If we have more batches to process, add delay to respect API rate limits
        if (i + batchSize < ordersList.length) {
          addDebugMessage(`Waiting ${delayBetweenBatches/1000} seconds before next batch to respect API rate limits...`);
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      }
      
      addDebugMessage(`Batch location update completed`);
      addDebugMessage(`Summary: Processed ${processedOrders} orders, Successfully updated ${successCount} orders, Failed ${errorCount} orders`);
      
      toast({
        title: "Batch Update Complete",
        description: `Processed ${processedOrders} orders (${successCount} successful, ${errorCount} failed)`,
        variant: "default",
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
          Update location information for all orders in the database (respects Shopify API rate limits)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-md text-sm text-red-300">
            {error}
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
