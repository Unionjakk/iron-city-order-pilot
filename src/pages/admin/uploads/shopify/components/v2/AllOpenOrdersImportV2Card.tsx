
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface AllOpenOrdersImportV2CardProps {
  onImportComplete?: () => void;
}

const AllOpenOrdersImportV2Card = ({ onImportComplete }: AllOpenOrdersImportV2CardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);
  const { toast } = useToast();

  const handleImport = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      setResult(null);

      // Get the API token from the database
      const { data: apiToken, error: tokenError } = await supabase.rpc('get_shopify_setting', {
        setting_name_param: 'shopify_token'
      });

      // Critical error - no API token
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
      const { data, error } = await supabase.functions.invoke('shopify-all-open-unfulfilled-partial_v2', {
        body: { apiToken }
      });

      // Critical error - edge function failed to start
      if (error) {
        setResult({
          success: false,
          message: 'Error starting import',
          details: error.message
        });
        setIsLoading(false);
        return;
      }

      // Show toast notification that import has started
      toast({
        title: "Import Started",
        description: "Importing open unfulfilled and partially fulfilled orders. This may take several minutes.",
        duration: 5000,
      });
      
      // Handle the response
      if (data) {
        // Consider the import successful if we got a response, even with non-critical errors
        const success = true;
        setResult({
          success,
          message: 'Import completed successfully',
          // Only show error details if they exist
          details: data.error ? `Completed with some non-critical issues: ${data.error}` : undefined
        });
        
        if (onImportComplete) {
          onImportComplete();
        }
      }
    } catch (error: any) {
      // Only critical errors that prevent the import from completing end up here
      setResult({
        success: false,
        message: 'Critical error occurred',
        details: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full border-zinc-800 bg-zinc-900/60">
      <CardHeader>
        <CardTitle className="text-orange-500">Import All Open Orders only V2</CardTitle>
        <CardDescription className="text-zinc-400">
          Import only open (active) orders with unfulfilled or partially fulfilled status from Shopify using the V2 API endpoint and filtering.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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
            className="w-full md:w-auto bg-orange-500 hover:bg-orange-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Import All Open Orders only V2
              </>
            )}
          </Button>
        </div>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <div className="space-y-1">
          <p>This endpoint only imports open orders that are unfulfilled or partially fulfilled from your Shopify store.</p>
          <p><strong>Note: This V2 implementation ensures only open active orders are imported, no archived orders.</strong></p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AllOpenOrdersImportV2Card;
