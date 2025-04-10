
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ImportErrorAlert from './ImportErrorAlert';

interface CompleteRefreshProps {
  onRefreshComplete: () => Promise<void>;
}

const CompleteRefresh = ({ onRefreshComplete }: CompleteRefreshProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const addDebugMessage = (message: string) => {
    console.log(`[DEBUG] ${message}`);
    setDebugInfo(prev => [message, ...prev].slice(0, 50)); // Keep last 50 messages
  };

  const handleCompleteRefresh = async () => {
    if (isDeleting || isImporting) return; // Prevent multiple clicks

    if (!confirm("WARNING: This will delete ALL existing orders and re-import them from Shopify. This operation cannot be undone. Are you sure you want to continue?")) {
      return;
    }

    setError(null);
    setIsDeleting(true);
    setDebugInfo([]);
    
    try {
      addDebugMessage("Starting complete refresh operation");
      
      // Step 1: Delete all orders from the orders table
      addDebugMessage("Step 1: Deleting all existing orders...");
      await deleteAllOrders();
      
      // Step 2: Import all orders from Shopify
      setIsDeleting(false);
      setIsImporting(true);
      addDebugMessage("Step 2: Importing all orders from Shopify...");
      await importAllOrders();
      
      // Step 3: Update last sync time
      addDebugMessage("Step 3: Updating last sync time...");
      await updateLastSyncTime();
      
      toast({
        title: "Refresh Complete",
        description: "All orders have been refreshed from Shopify",
        variant: "default",
      });
      
      addDebugMessage("Complete refresh operation finished successfully");
      
      // Refresh the orders list in the parent component
      await onRefreshComplete();
    } catch (error: any) {
      console.error("Error during complete refresh:", error);
      setError(error.message || "An unknown error occurred");
      addDebugMessage(`ERROR: ${error.message || "Unknown error"}`);
      
      toast({
        title: "Refresh Failed",
        description: error.message || "Failed to complete the refresh operation",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsImporting(false);
    }
  };
  
  const deleteAllOrders = async () => {
    try {
      // Delete from shopify_order_items first (foreign key constraints)
      addDebugMessage("Deleting all order items...");
      const { error: itemsError } = await supabase
        .from('shopify_order_items')
        .delete()
        .neq('order_id', '00000000-0000-0000-0000-000000000000'); // Delete all
        
      if (itemsError) {
        throw new Error(`Failed to delete order items: ${itemsError.message}`);
      }
      addDebugMessage("Successfully deleted all order items");
      
      // FIX: Use row-by-row deletion approach which is more reliable
      addDebugMessage("Fetching all order IDs for deletion...");
      const { data: orderIds, error: fetchError } = await supabase
        .from('shopify_orders')
        .select('id');
      
      if (fetchError) {
        throw new Error(`Failed to fetch order IDs: ${fetchError.message}`);
      }
      
      if (!orderIds || orderIds.length === 0) {
        addDebugMessage("No orders found to delete");
        return;
      }
      
      addDebugMessage(`Found ${orderIds.length} orders to delete`);
      
      // Delete each order individually
      addDebugMessage("Deleting orders one by one...");
      const batchSize = 50; // Process in smaller batches
      let deletedCount = 0;
      
      for (let i = 0; i < orderIds.length; i += batchSize) {
        const batch = orderIds.slice(i, i + batchSize);
        const batchIds = batch.map(order => order.id);
        
        // Delete this batch
        const { error: batchError } = await supabase
          .from('shopify_orders')
          .delete()
          .in('id', batchIds);
        
        if (batchError) {
          throw new Error(`Error deleting batch of orders: ${batchError.message}`);
        }
        
        deletedCount += batch.length;
        addDebugMessage(`Deleted ${deletedCount}/${orderIds.length} orders...`);
      }
      
      // Verify all orders are deleted
      const { count, error: countError } = await supabase
        .from('shopify_orders')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        throw new Error(`Failed to verify order deletion: ${countError.message}`);
      }
      
      if (count && count > 0) {
        throw new Error(`Order deletion failed: ${count} orders still remain in database after deletion`);
      }
      
      addDebugMessage("Successfully deleted all orders - verified zero remaining");
    } catch (error) {
      console.error("Error deleting orders:", error);
      throw error;
    }
  };
  
  const importAllOrders = async () => {
    try {
      addDebugMessage("Getting API token from database...");
      const token = await getTokenFromDatabase();
      
      if (!token) {
        throw new Error("No API token found in database. Please add your Shopify API token first.");
      }
      
      addDebugMessage("Calling shopify-sync-all edge function...");
      
      // Call the edge function for complete refresh
      const response = await supabase.functions.invoke('shopify-sync-all', {
        body: { apiToken: token }
      });

      if (response.error) {
        console.error('Error invoking shopify-sync-all function:', response.error);
        throw new Error(`Failed to connect to Shopify API: ${response.error.message || 'Unknown error'}`);
      }
      
      const data = response.data;
      
      if (!data || !data.success) {
        const errorMsg = data?.error || 'Unknown error occurred during Shopify sync';
        console.error('Shopify sync failed:', errorMsg);
        throw new Error(`Shopify sync failed: ${errorMsg}`);
      }
      
      // Verify that orders were imported with line items
      const { count: orderCount, error: orderCountError } = await supabase
        .from('shopify_orders')
        .select('*', { count: 'exact', head: true });
      
      if (orderCountError) {
        console.error('Error checking imported order count:', orderCountError);
      } else if (!orderCount || orderCount === 0) {
        throw new Error('No orders were imported from Shopify');
      }
      
      const { count: lineItemCount, error: lineItemCountError } = await supabase
        .from('shopify_order_items')
        .select('*', { count: 'exact', head: true });
      
      if (lineItemCountError) {
        console.error('Error checking imported line item count:', lineItemCountError);
      } else if (!lineItemCount || lineItemCount === 0) {
        throw new Error('Orders were imported but no line items were created');
      }
      
      addDebugMessage(`Successfully imported ${data.imported || 0} orders with ${lineItemCount || 0} line items`);
      return data;
    } catch (error) {
      console.error("Error importing orders:", error);
      throw error;
    }
  };
  
  const updateLastSyncTime = async () => {
    try {
      addDebugMessage("Updating last sync time...");
      const { error: updateError } = await supabase.rpc("upsert_shopify_setting", {
        setting_name_param: "last_sync_time",
        setting_value_param: new Date().toISOString()
      });

      if (updateError) {
        throw new Error(`Failed to update last sync time: ${updateError.message}`);
      }
      addDebugMessage("Successfully updated last sync time");
    } catch (error) {
      console.error("Error updating last sync time:", error);
      throw error;
    }
  };
  
  const getTokenFromDatabase = async () => {
    try {
      // Using RPC for type safety
      const { data, error } = await supabase.rpc('get_shopify_setting', { 
        setting_name_param: 'shopify_token' 
      });
      
      if (error) {
        console.error('Error retrieving token from database:', error);
        return null;
      }
      
      // Check if we have a valid token (not the placeholder)
      if (data && typeof data === 'string' && data !== 'placeholder_token') {
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Exception retrieving token:', error);
      return null;
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-red-500">Complete Data Refresh</CardTitle>
        <CardDescription className="text-zinc-400">
          Delete all existing orders and re-import from Shopify
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-red-900/20 border-red-500/50">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <AlertTitle className="text-red-400">Warning: Destructive Operation</AlertTitle>
          <AlertDescription className="text-zinc-300">
            This will delete ALL current orders and import them fresh from Shopify. 
            This is useful if your local data is out of sync with Shopify. 
            This operation cannot be undone.
          </AlertDescription>
        </Alert>
        
        <Button 
          onClick={handleCompleteRefresh} 
          className="w-full bg-red-600 hover:bg-red-700"
          disabled={isDeleting || isImporting}
        >
          {isDeleting ? (
            <>
              <Trash2 className="mr-2 h-4 w-4 animate-pulse" />
              Deleting All Data...
            </>
          ) : isImporting ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Importing All Orders...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Delete All & Re-Import Everything
            </>
          )}
        </Button>
        
        {error && (
          <ImportErrorAlert 
            error={error} 
            onDismiss={() => setError(null)}
          />
        )}
        
        {debugInfo.length > 0 && (
          <div className="mt-4 border border-zinc-800 rounded-md p-2 bg-zinc-950/50">
            <h4 className="text-orange-500 text-sm font-medium mb-2">Debug Information</h4>
            <div className="max-h-60 overflow-y-auto text-xs font-mono">
              {debugInfo.map((message, index) => (
                <div key={index} className="py-1 border-b border-zinc-800 last:border-0">
                  <span className="text-zinc-500">[{new Date().toISOString().substring(11, 19)}]</span>{' '}
                  <span className="text-zinc-300">{message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompleteRefresh;
