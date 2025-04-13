
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SingleOrderImportCardProps {
  onImportComplete?: () => void;
}

const SingleOrderImportCard = ({ onImportComplete }: SingleOrderImportCardProps) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  const handleImport = async () => {
    // Trim and remove any leading '#' from the order number
    const cleanOrderNumber = orderNumber.trim().replace(/^#/, '');
    
    if (!cleanOrderNumber) {
      setResult({
        success: false,
        message: 'Please enter a valid Shopify order number',
      });
      return;
    }

    try {
      setIsLoading(true);
      setResult(null);

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
        return;
      }

      // Call the edge function to import the single order
      const { data, error } = await supabase.functions.invoke('shopify-import-single-order', {
        body: { 
          apiToken,
          orderNumber: cleanOrderNumber
        }
      });

      if (error) {
        setResult({
          success: false,
          message: 'Error importing order',
          details: error.message
        });
        return;
      }

      if (data.success) {
        setResult({
          success: true,
          message: data.imported ? 'Order imported successfully' : 'Order was not eligible for import',
          details: data.message || ''
        });
        
        // Clear the input on success
        setOrderNumber('');
        
        // Call the onImportComplete callback if provided
        if (onImportComplete) {
          onImportComplete();
        }
      } else {
        setResult({
          success: false,
          message: 'Failed to import order',
          details: data.message || data.error || 'Unknown error'
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: 'Exception occurred',
        details: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full border-zinc-800 bg-zinc-900/60">
      <CardHeader>
        <CardTitle className="text-orange-500">Single Order Import</CardTitle>
        <CardDescription className="text-zinc-400">
          Import a single order from Shopify by its order number. Only unfulfilled or partially fulfilled orders will be imported.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2">
          <Input
            placeholder="Enter Shopify order number (e.g., #1001)"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            disabled={isLoading}
            className="max-w-md bg-zinc-800 border-zinc-700 text-zinc-300"
          />
          <Button 
            onClick={handleImport} 
            disabled={isLoading || !orderNumber.trim().replace(/^#/, '')}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : 'Import Order'}
          </Button>
        </div>

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
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Note: This will only import orders that are unfulfilled or partially fulfilled.
        It will not modify or delete existing orders.
      </CardFooter>
    </Card>
  );
};

export default SingleOrderImportCard;
