
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
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

  // Poll for progress updates
  const startPolling = () => {
    const pollInterval = setInterval(async () => {
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

        // Check if import is complete
        if (statusData === 'complete') {
          setIsLoading(false);
          setProgress(100);
          setResult({
            success: true,
            message: `Import complete! Imported ${importedOrders} orders with ${importedLines} line items.`
          });
          clearInterval(pollInterval);
          
          if (onImportComplete) {
            onImportComplete();
          }
        } else if (statusData === 'error') {
          setIsLoading(false);
          setResult({
            success: false,
            message: 'Import failed. Check console for details.'
          });
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Error polling for import status:', error);
      }
    }, 2000);

    // Store the interval ID for cleanup
    return pollInterval;
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
      const pollInterval = startPolling();

      // If there's an immediate error, handle it
      if (error) {
        setResult({
          success: false,
          message: 'Error starting import',
          details: error.message
        });
        setIsLoading(false);
        clearInterval(pollInterval);
        return;
      }

      // Show toast notification that import has started
      toast({
        title: "Import Started",
        description: "Importing all open unfulfilled and partially fulfilled orders. This may take several minutes.",
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
        clearInterval(pollInterval);
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: 'Exception occurred',
        details: error.message
      });
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle>All Open Unfulfilled Orders and Open Partial Orders Import</CardTitle>
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
              </AlertDescription>
            </Alert>
          )}
          
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
        </div>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <div className="space-y-1">
          <p>This will import all unfulfilled and partially fulfilled orders from your Shopify store.</p>
          <p>Progress will be tracked and updated in real-time.</p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AllOpenOrdersImport;
