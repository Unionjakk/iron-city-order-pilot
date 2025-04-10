
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Key, RefreshCw, Shield, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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
    if (!token || token.length <= 8) return '********';
    return token.substring(0, 4) + '********' + token.substring(token.length - 4);
  };

  // Improved token detection function
  const detectToken = () => {
    try {
      const storedToken = localStorage.getItem('shopify_token');
      console.log('ApiTokenForm - detecting token:', !!storedToken);
      
      if (storedToken) {
        // Token found - update state
        setHasToken(true);
        setMaskedToken(maskToken(storedToken));
      } else {
        // No token found - clear state
        setHasToken(false);
        setMaskedToken('');
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
  };

  // Check for token in localStorage on mount with improved reliability
  useEffect(() => {
    // Immediate check
    detectToken();
    
    // Retry after a short delay in case the parent component is still initializing
    const timeoutId = setTimeout(detectToken, 500);
    
    return () => clearTimeout(timeoutId);
  }, [setHasToken, setMaskedToken]);

  // Handle form submission with improved error handling
  const onSubmit = (data: ApiTokenForm) => {
    setIsLoading(true);
    
    try {
      // Save token to localStorage
      localStorage.setItem('shopify_token', data.apiToken);
      console.log('Token saved to localStorage');
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new Event('shopify_token_updated'));
      
      // Update UI
      setMaskedToken(maskToken(data.apiToken));
      setHasToken(true);
      
      toast({
        title: "API Token Saved",
        description: "Your Shopify API token has been securely saved.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error saving token:', error);
      toast({
        title: "Error Saving Token",
        description: "There was a problem saving your API token.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      form.reset();
    }
  };

  // Handle token removal with improved error handling
  const handleRemoveToken = () => {
    try {
      localStorage.removeItem('shopify_token');
      console.log('Token removed from localStorage');
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new Event('shopify_token_updated'));
      
      setHasToken(false);
      setMaskedToken('');
      
      toast({
        title: "API Token Removed",
        description: "Your Shopify API token has been removed.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error removing token:', error);
      toast({
        title: "Error Removing Token",
        description: "There was a problem removing your API token.",
        variant: "destructive",
      });
    }
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
