
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface ApiConfigCardProps {
  isLoading: boolean;
  hasToken: boolean;
  maskedToken: string;
  setHasToken: (hasToken: boolean) => void;
  setMaskedToken: (maskedToken: string) => void;
}

const ApiConfigCard = ({ 
  isLoading, 
  hasToken, 
  maskedToken, 
  setHasToken, 
  setMaskedToken 
}: ApiConfigCardProps) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const { toast } = useToast();
  
  const handleRemoveToken = async () => {
    setIsRemoving(true);
    try {
      const { error } = await supabase.rpc('upsert_shopify_setting', { 
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
      });
    } catch (error) {
      console.error('Error removing token:', error);
      toast({
        title: "Error Removing Token",
        description: "There was a problem removing your API token from the database.",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-orange-500 flex items-center">
          <Shield className="mr-2 h-5 w-5" /> Shopify API Configuration
        </CardTitle>
        <CardDescription className="text-zinc-400">Securely connect to your Shopify store</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4 text-zinc-400">
            Loading API configuration...
          </div>
        ) : hasToken ? (
          <div className="space-y-4">
            <Alert variant="warning" className="bg-zinc-800/60 border-green-500/50">
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
              disabled={isRemoving}
            >
              {isRemoving ? "Removing..." : "Remove API Token"}
            </Button>
          </div>
        ) : (
          <div className="text-zinc-400">
            Please use the previous version of the integration page to set up your API token.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiConfigCard;
