
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
import { supabase } from '@/integrations/supabase/client';

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

  // Database fetch function to get the token
  const fetchTokenFromDatabase = async () => {
    setIsLoading(true);
    try {
      // Using RPC for type safety
      const { data, error } = await supabase
        .rpc('get_shopify_setting', { setting_name_param: 'shopify_token' });
      
      if (error) {
        console.error('Error fetching token from database:', error);
        setHasToken(false);
        setMaskedToken('');
        return false;
      }
      
      if (data && data !== 'placeholder_token') {
        setHasToken(true);
        setMaskedToken(maskToken(data));
        return true;
      } else {
        setHasToken(false);
        setMaskedToken('');
        return false;
      }
    } catch (error) {
      console.error('Exception fetching token:', error);
      setHasToken(false);
      setMaskedToken('');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Check for token in database on component mount
  useEffect(() => {
    fetchTokenFromDatabase();
    
    // Set up a subscription to token changes
    const channel = supabase
      .channel('shopify_settings_changes')
      .on('postgres_changes', 
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shopify_settings',
          filter: 'setting_name=eq.shopify_token'
        }, 
        () => {
          fetchTokenFromDatabase();
        })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle form submission - save token to database
  const onSubmit = async (data: ApiTokenForm) => {
    setIsLoading(true);
    
    try {
      // Save token to database using RPC for type safety
      const { error } = await supabase
        .rpc('upsert_shopify_setting', { 
          setting_name_param: 'shopify_token',
          setting_value_param: data.apiToken
        });
      
      if (error) {
        throw error;
      }
      
      // Update UI state
      setMaskedToken(maskToken(data.apiToken));
      setHasToken(true);
      
      toast({
        title: "API Token Saved",
        description: "Your Shopify API token has been securely saved to the database.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error saving token to database:', error);
      toast({
        title: "Error Saving Token",
        description: "There was a problem saving your API token to the database.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      form.reset();
    }
  };

  // Handle token removal from database
  const handleRemoveToken = async () => {
    setIsLoading(true);
    try {
      // Reset token in database to placeholder using RPC for type safety
      const { error } = await supabase
        .rpc('upsert_shopify_setting', { 
          setting_name_param: 'shopify_token',
          setting_value_param: 'placeholder_token'
        });
      
      if (error) {
        throw error;
      }
      
      setHasToken(false);
      setMaskedToken('');
      
      toast({
        title: "API Token Removed",
        description: "Your Shopify API token has been removed from the database.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error removing token from database:', error);
      toast({
        title: "Error Removing Token",
        description: "There was a problem removing your API token from the database.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Remove API Token"}
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
                    This token will be stored securely in the database and used to access your Shopify orders.
                  </FormDescription>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
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
