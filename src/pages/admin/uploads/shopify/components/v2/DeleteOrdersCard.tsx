
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';

const DeleteOrdersCard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  const handleDelete = async () => {
    if (!window.confirm('WARNING: This will permanently delete ALL imported Shopify orders and order lines. This action cannot be undone. Are you sure you want to proceed?')) {
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

      // Call the edge function to delete all orders
      const { data, error } = await supabase.functions.invoke('shopify-database-cleanup', {
        body: { apiToken }
      });

      if (error) {
        setResult({
          success: false,
          message: 'Error deleting orders',
          details: error.message
        });
        return;
      }

      if (data.success) {
        setResult({
          success: true,
          message: 'All orders and order items deleted successfully',
          details: data.debugMessages ? data.debugMessages.join('\n') : ''
        });
      } else {
        setResult({
          success: false,
          message: 'Failed to delete orders',
          details: data.error || data.debugMessages?.join('\n') || 'Unknown error'
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
        <CardTitle className="text-red-500">Delete All Shopify Orders and Order Lines</CardTitle>
        <CardDescription className="text-zinc-400">
          Permanently delete all imported Shopify orders and order lines from the database.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2">
          <Button 
            variant="destructive"
            onClick={handleDelete} 
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All Orders
              </>
            )}
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
      <CardFooter className="text-sm text-muted-foreground text-red-300/70">
        Warning: This is a destructive operation that permanently removes all Shopify order data from the database.
      </CardFooter>
    </Card>
  );
};

export default DeleteOrdersCard;
