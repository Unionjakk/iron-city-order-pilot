
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface AllOpenOrdersImportProps {
  onImportComplete?: () => void;
}

const AllOpenOrdersImport = ({ onImportComplete }: AllOpenOrdersImportProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importedOrders, setImportedOrders] = useState(0);
  const [importedLines, setImportedLines] = useState(0);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);
  const { toast } = useToast();
  
  // Added state to track polling interval
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  
  // Cleanup polling on component unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Poll for progress updates
  const startPolling = () => {
    // Clear any existing interval first
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    const interval = window.setInterval(async () => {
      try {
        // Check status
        const { data: statusData } = await supabase.rpc('get_shopify_setting', {
          setting_name_param: 'shopify_import_status'
        });

        // Get current counts
        const { data: ordersData } = await supabase.rpc('get_shopify_setting', {
          setting_name_param: 'shopify_orders_imported'
        });
        
        const { data: linesData } = await supabase.rpc('get_shopify_setting', {
          setting_name_param: 'shopify_orders_lines_imported'
        });

        // Update counters
        if (ordersData) setImportedOrders(parseInt(ordersData) || 0);
        if (linesData) setImportedLines(parseInt(linesData) || 0);
        
        // Update progress
        if (importedOrders > 0) {
          setProgress(Math.min(99, Math.floor((importedOrders / Math.max(importedOrders, 50)) * 100)));
        }

        console.log(`Import status: ${statusData}, Orders: ${ordersData}, Lines: ${linesData}`);

        // Check if import is complete
        if (statusData === 'complete') {
          setIsLoading(false);
          setProgress(100);
          
          // Verify final counts by querying the database directly
          const { count: actualOrderCount } = await supabase
            .from('shopify_orders')
            .select('*', { count: 'exact', head: true });
            
          const { count: actualItemCount } = await supabase
            .from('shopify_order_items')
            .select('*', { count: 'exact', head: true });
          
          // Update settings with actual counts if needed
          if (actualOrderCount !== parseInt(ordersData || '0')) {
            await supabase.rpc('upsert_shopify_setting', {
              setting_name_param: 'shopify_orders_imported',
              setting_value_param: String(actualOrderCount)
            });
            setImportedOrders(actualOrderCount || 0);
          }
          
          if (actualItemCount !== parseInt(linesData || '0')) {
            await supabase.rpc('upsert_shopify_setting', {
              setting_name_param: 'shopify_orders_lines_imported',
              setting_value_param: String(actualItemCount)
            });
            setImportedLines(actualItemCount || 0);
          }
          
          setResult({
            success: true,
            message: `Import complete! Imported ${actualOrderCount || importedOrders} orders with ${actualItemCount || importedLines} line items.`
          });
          clearInterval(interval);
          setPollingInterval(null);
          
          if (onImportComplete) {
            onImportComplete();
          }
        } else if (statusData === 'error') {
          setIsLoading(false);
          setResult({
            success: false,
            message: 'Import failed. Check console for details.'
          });
          clearInterval(interval);
          setPollingInterval(null);
        } else if (statusData === 'idle' && isLoading) {
          // Handle case where status might have been reset inadvertently
          console.log('Import status is idle but component thinks import is still running');
          // Check if we have orders - if yes, import might have succeeded
          if (importedOrders > 0) {
            setIsLoading(false);
            setProgress(100);
            setResult({
              success: true,
              message: `Import appears complete! Found ${importedOrders} orders with ${importedLines} line items.`
            });
            clearInterval(interval);
            setPollingInterval(null);
            
            if (onImportComplete) {
              onImportComplete();
            }
          }
        }
      } catch (error) {
        console.error('Error polling for import status:', error);
      }
    }, 2000);

    // Store the interval ID for cleanup
    setPollingInterval(interval);
  };

  // Function to verify current database counts
  const verifyCurrentCounts = async () => {
    toast({
      title: "Refreshing counts",
      description: "Checking current database counts...",
    });
    
    try {
      // Get actual counts from database
      const { count: actualOrderCount } = await supabase
        .from('shopify_orders')
        .select('*', { count: 'exact', head: true });
        
      const { count: actualItemCount } = await supabase
        .from('shopify_order_items')
        .select('*', { count: 'exact', head: true });
      
      // Update settings with actual counts
      await supabase.rpc('upsert_shopify_setting', {
        setting_name_param: 'shopify_orders_imported',
        setting_value_param: String(actualOrderCount)
      });
      
      await supabase.rpc('upsert_shopify_setting', {
        setting_name_param: 'shopify_orders_lines_imported',
        setting_value_param: String(actualItemCount)
      });
      
      // Update UI
      setImportedOrders(actualOrderCount || 0);
      setImportedLines(actualItemCount || 0);
      
      toast({
        title: "Counts refreshed",
        description: `Found ${actualOrderCount} orders and ${actualItemCount} line items in the database.`,
      });
      
      // Update result if shown
      if (result) {
        setResult({
          ...result,
          message: `${result.success ? 'Import complete!' : 'Import failed.'} Found ${actualOrderCount} orders with ${actualItemCount} line items.`
        });
      }
    } catch (error) {
      console.error('Error verifying counts:', error);
      toast({
        title: "Error",
        description: "Failed to verify counts. Check console for details.",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      setResult(null);
      setProgress(0);
      setImportedOrders(0);
      setImportedLines(0);

      // Reset counters in database
      await supabase.rpc('upsert_shopify_setting', {
        setting_name_param: 'shopify_orders_imported',
        setting_value_param: '0'
      });
      
      await supabase.rpc('upsert_shopify_setting', {
        setting_name_param: 'shopify_orders_lines_imported',
        setting_value_param: '0'
      });

      // Get the API token from the database
      const { data: apiToken, error: tokenError } = await supabase.rpc('get_shopify_setting', {
        setting_name_param: 'shopify_token'
      });

      if (tokenError || !apiToken) {
        setResult({
          success: false,
          message: 'Failed to retrieve API token',
          details: tokenError?.message || 'No API token found in settings'
        });
        setIsLoading(false);
        return;
      }

      // Call the edge function to import all open orders
      const { data, error } = await supabase.functions.invoke('shopify-all-open-unfulfilled-partial', {
        body: { apiToken }
      });

      // Start polling for updates
      startPolling();

      // If there's an immediate error, handle it
      if (error) {
        setResult({
          success: false,
          message: 'Error starting import',
          details: error.message
        });
        setIsLoading(false);
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        return;
      }

      // Show toast notification that import has started
      toast({
        title: "Import Started",
        description: "Importing open unfulfilled and partially fulfilled orders. This may take several minutes.",
        duration: 5000,
      });
      
      // If we get an immediate response with details, update the UI
      if (data && data.success === false) {
        setResult({
          success: false,
          message: 'Failed to import orders',
          details: data.error || data.message || 'Unknown error'
        });
        setIsLoading(false);
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: 'Exception occurred',
        details: error.message
      });
      setIsLoading(false);
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-500">
          <span>All Open Unfulfilled Orders and Open Partial Orders Import</span>
        </CardTitle>
        <CardDescription>
          Import all open unfulfilled and partially fulfilled orders from Shopify using the configured API endpoint and token.
          This operation may take several minutes to complete due to API rate limits (40 requests per minute).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Importing orders...</span>
                <span>{importedOrders} orders / {importedLines} line items</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          {result && (
            <Alert 
              className="mt-4" 
              variant={result.success ? "default" : "destructive"}
            >
              {result.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>
                {result.message}
                {result.details && (
                  <div className="text-sm mt-1 opacity-85">
                    {result.details}
                  </div>
                )}
                <div className="mt-2 text-sm">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={verifyCurrentCounts}
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" /> Refresh Counts
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={handleImport} 
              disabled={isLoading}
              className="w-full md:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : 'Import All Open Orders'}
            </Button>
            
            {!isLoading && (
              <Button 
                variant="outline" 
                onClick={verifyCurrentCounts}
                className="w-full md:w-auto"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Verify DB Counts
              </Button>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <div className="space-y-1">
          <p>This will import all open unfulfilled and partially fulfilled orders from your Shopify store.</p>
          <p><strong>Note: Archived orders will not be imported.</strong></p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AllOpenOrdersImport;
