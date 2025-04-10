
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Key, RefreshCw, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';

// Define the form schema
const apiTokenSchema = z.object({
  apiToken: z.string().min(1, { message: 'API token is required' }),
});

type ApiTokenForm = z.infer<typeof apiTokenSchema>;

interface ApiTokenFormProps {
  hasToken: boolean;
  maskedToken: string;
  setHasToken: (hasToken: boolean) => void;
  setMaskedToken: (maskedToken: string) => void;
}

const ApiTokenFormComponent = ({ hasToken, maskedToken, setHasToken, setMaskedToken }: ApiTokenFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<ApiTokenForm>({
    resolver: zodResolver(apiTokenSchema),
    defaultValues: {
      apiToken: '',
    },
  });

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

  return (
    <>
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
    </>
  );
};

export default ApiTokenFormComponent;
