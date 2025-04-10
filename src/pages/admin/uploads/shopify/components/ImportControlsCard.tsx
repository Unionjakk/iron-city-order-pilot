
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, RefreshCw, AlertCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImportControls from '@/components/shopify/ImportControls';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Code } from '@/components/ui/code';
import { useToast } from '@/hooks/use-toast';

interface ImportControlsCardProps {
  lastImport: string | null;
  fetchRecentOrders: () => Promise<void>;
  ordersLoading: boolean;
  handleRefresh: () => void;
  apiError?: string | null;
}

const ImportControlsCard = ({ 
  lastImport, 
  fetchRecentOrders, 
  ordersLoading, 
  handleRefresh,
  apiError
}: ImportControlsCardProps) => {
  const { toast } = useToast();

  const copyErrorToClipboard = () => {
    if (apiError) {
      navigator.clipboard.writeText(apiError);
      toast({
        title: "Copied to clipboard",
        description: "Error details have been copied to your clipboard",
        variant: "default",
      });
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-orange-500 flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" /> Order Import Controls
          </CardTitle>
          <CardDescription className="text-zinc-400">Manage Shopify unfulfilled order imports</CardDescription>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          size="sm"
          disabled={ordersLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${ordersLoading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </CardHeader>
      <CardContent>
        {apiError && (
          <Alert className="mb-4 bg-red-900/20 border border-red-500/50">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <div className="flex flex-col w-full">
              <div className="flex justify-between items-start">
                <AlertDescription className="text-red-200 font-semibold">
                  API Connection Error:
                </AlertDescription>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-zinc-400 hover:text-zinc-200"
                  onClick={copyErrorToClipboard}
                >
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              </div>
              <Code className="mt-2 bg-red-950/30 text-red-200 break-all">
                {apiError}
              </Code>
            </div>
          </Alert>
        )}
        
        <ImportControls 
          lastImport={lastImport} 
          fetchRecentOrders={fetchRecentOrders} 
        />
      </CardContent>
    </Card>
  );
};

export default ImportControlsCard;
