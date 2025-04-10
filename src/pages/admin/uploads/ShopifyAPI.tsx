
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShoppingCart, RefreshCw, CheckCircle, AlertCircle, Key, Clock, Shield, Info } from 'lucide-react';

// Define the form schema
const apiTokenSchema = z.object({
  apiToken: z.string().min(1, { message: 'API token is required' }),
});

type ApiTokenForm = z.infer<typeof apiTokenSchema>;

// Mock data for demonstration
const mockOrders = [
  {
    id: 'SH1001',
    shopify_order_id: '4501234567',
    created_at: '2025-04-09T15:30:00Z',
    customer_name: 'John Smith',
    items_count: 3,
    status: 'imported'
  },
  {
    id: 'SH1002',
    shopify_order_id: '4501234568',
    created_at: '2025-04-09T16:45:00Z',
    customer_name: 'Jane Doe',
    items_count: 1,
    status: 'stock_checked'
  },
  {
    id: 'SH1003',
    shopify_order_id: '4501234569',
    created_at: '2025-04-10T09:15:00Z',
    customer_name: 'Robert Johnson',
    items_count: 5,
    status: 'partial_pick'
  }
];

const ShopifyAPI = () => {
  const [hasToken, setHasToken] = useState(false);
  const [maskedToken, setMaskedToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastImport, setLastImport] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importedOrders, setImportedOrders] = useState(mockOrders);
  const { toast } = useToast();

  const form = useForm<ApiTokenForm>({
    resolver: zodResolver(apiTokenSchema),
    defaultValues: {
      apiToken: '',
    },
  });

  // Check for existing token on component mount (in a real app, this would check local storage or a backend API)
  useEffect(() => {
    // This is a simulation - in a real app, you'd check if the token exists in secure storage
    const checkExistingToken = () => {
      // Simulating an existing token check
      const hasExistingToken = localStorage.getItem('shopify_token') !== null;
      
      if (hasExistingToken) {
        // Create a masked version of the token for display
        const token = localStorage.getItem('shopify_token') || '';
        const masked = maskToken(token);
        setMaskedToken(masked);
        setHasToken(true);
      }
    };
    
    checkExistingToken();
  }, []);

  // Function to mask the token for display
  const maskToken = (token: string) => {
    if (token.length <= 8) return '********';
    return token.substring(0, 4) + '********' + token.substring(token.length - 4);
  };

  // Handle form submission
  const onSubmit = (data: ApiTokenForm) => {
    setIsLoading(true);
    
    // Simulate API call to validate token
    setTimeout(() => {
      // In a real app, you would verify the token with Shopify here
      // For now, we'll just save it to localStorage for demonstration
      localStorage.setItem('shopify_token', data.apiToken);
      
      // Update the UI
      setMaskedToken(maskToken(data.apiToken));
      setHasToken(true);
      setIsLoading(false);
      
      toast({
        title: "API Token Saved",
        description: "Your Shopify API token has been securely saved.",
        variant: "default",
      });
      
      form.reset();
    }, 1000);
  };

  // Handle token removal
  const handleRemoveToken = () => {
    localStorage.removeItem('shopify_token');
    setHasToken(false);
    setMaskedToken('');
    
    toast({
      title: "API Token Removed",
      description: "Your Shopify API token has been removed.",
      variant: "default",
    });
  };

  // Handle manual import
  const handleManualImport = () => {
    setIsImporting(true);
    
    // Simulate import process
    setTimeout(() => {
      setIsImporting(false);
      setLastImport(new Date().toISOString());
      
      toast({
        title: "Import Completed",
        description: "Successfully imported 3 new orders from Shopify.",
        variant: "default",
      });
    }, 2000);
  };

  // Function to render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'imported':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Imported</Badge>;
      case 'stock_checked':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Stock Checked</Badge>;
      case 'partial_pick':
        return <Badge className="bg-orange-500 hover:bg-orange-600">Partial Pick</Badge>;
      case 'backordered':
        return <Badge className="bg-red-500 hover:bg-red-600">Backordered</Badge>;
      case 'fulfilled':
        return <Badge className="bg-green-500 hover:bg-green-600">Fulfilled</Badge>;
      default:
        return <Badge className="bg-zinc-500 hover:bg-zinc-600">{status}</Badge>;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">Shopify API Integration</h1>
        <p className="text-orange-400/80">Configure and manage Shopify order imports</p>
      </div>
      
      {/* API Configuration Card */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-orange-500 flex items-center">
            <Shield className="mr-2 h-5 w-5" /> Shopify API Configuration
          </CardTitle>
          <CardDescription className="text-zinc-400">Securely connect to your Shopify store</CardDescription>
        </CardHeader>
        <CardContent>
          {hasToken ? (
            <div className="space-y-4">
              <Alert className="bg-zinc-800/60 border-green-500/50">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle className="text-green-500">API Connection Active</AlertTitle>
                <AlertDescription className="text-zinc-300">
                  Your Shopify store is connected with API token: {maskedToken}
                </AlertDescription>
              </Alert>
              
              <Button 
                variant="destructive" 
                className="mt-2" 
                onClick={handleRemoveToken}
              >
                Remove API Token
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="apiToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">Shopify Admin API Access Token</FormLabel>
                      <FormControl>
                        <div className="flex space-x-2">
                          <div className="relative flex-grow">
                            <Key className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                            <Input
                              placeholder="Enter your Shopify Admin API access token"
                              type="password"
                              className="pl-10 bg-zinc-800 border-zinc-700 text-zinc-300"
                              {...field}
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription className="text-zinc-500">
                        This token will be stored securely and used to access your Shopify orders.
                      </FormDescription>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Save API Token
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
      
      {/* Import Controls */}
      {hasToken && (
        <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-orange-500 flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5" /> Order Import Controls
            </CardTitle>
            <CardDescription className="text-zinc-400">Manage Shopify unfulfilled order imports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center text-zinc-400">
                  <Clock className="mr-2 h-4 w-4" />
                  <span>
                    {lastImport 
                      ? `Last import: ${formatDate(lastImport)}` 
                      : 'No imports have been run yet'}
                  </span>
                </div>
                
                <div className="flex items-center text-zinc-400">
                  <Info className="mr-2 h-4 w-4" />
                  <span>Auto-import scheduled every 30 minutes</span>
                </div>
              </div>
              
              <Button 
                onClick={handleManualImport} 
                className="bg-orange-500 hover:bg-orange-600"
                disabled={isImporting}
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Import Orders Now
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Recent Imports */}
      {hasToken && (
        <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-orange-500">Recent Imported Orders</CardTitle>
            <CardDescription className="text-zinc-400">
              View and manage your recently imported orders from Shopify
            </CardDescription>
          </CardHeader>
          <CardContent>
            {importedOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-800/50">
                    <TableRow>
                      <TableHead className="text-zinc-400">Order ID</TableHead>
                      <TableHead className="text-zinc-400">Created</TableHead>
                      <TableHead className="text-zinc-400">Customer</TableHead>
                      <TableHead className="text-zinc-400">Items</TableHead>
                      <TableHead className="text-zinc-400">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importedOrders.map((order) => (
                      <TableRow key={order.id} className="border-zinc-800 hover:bg-zinc-800/30">
                        <TableCell className="font-medium text-zinc-300">
                          #{order.shopify_order_id}
                        </TableCell>
                        <TableCell className="text-zinc-400">
                          {formatDate(order.created_at)}
                        </TableCell>
                        <TableCell className="text-zinc-300">
                          {order.customer_name}
                        </TableCell>
                        <TableCell className="text-zinc-300">
                          {order.items_count}
                        </TableCell>
                        <TableCell>
                          {renderStatusBadge(order.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-zinc-400">No orders imported yet</h3>
                <p className="text-zinc-500 mt-1">
                  When you import orders from Shopify, they will appear here.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t border-zinc-800 bg-zinc-900/30 px-6 py-3">
            <div className="text-sm text-zinc-500">
              Showing {importedOrders.length} orders. Orders will automatically progress through the fulfillment workflow.
            </div>
          </CardFooter>
        </Card>
      )}
      
      {/* API Documentation */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-orange-500">API Integration Details</CardTitle>
          <CardDescription className="text-zinc-400">Technical information about the Shopify integration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-orange-400 mb-2">Endpoint Information</h3>
              <code className="block p-4 bg-zinc-800/60 rounded-lg text-sm text-zinc-300 font-mono overflow-x-auto">
                https://opus-harley-davidson.myshopify.com/admin/api/2023-07/orders.json<br/>
                ?status=unfulfilled<br/>
                &limit=250<br/>
                &fields=id,created_at,customer,line_items,shipping_address,note
              </code>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-orange-400 mb-2">Integration Features</h3>
              <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                <li>Secure API token storage and management</li>
                <li>Automatic filtering for unfulfilled orders</li>
                <li>Scheduled imports every 30 minutes</li>
                <li>Manual import trigger for immediate updates</li>
                <li>Order status tracking through fulfillment workflow</li>
                <li>Integration with Pinnacle inventory system</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopifyAPI;
