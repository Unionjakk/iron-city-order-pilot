
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BatchLocationUpdateCardProps {
  disabled?: boolean;
  onUpdateComplete?: () => void;
}

const BatchLocationUpdateCard = ({ disabled = false, onUpdateComplete }: BatchLocationUpdateCardProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleBatchUpdate = async () => {
    if (disabled) {
      toast({
        title: "Operation Blocked",
        description: "Please wait until the current refresh operation completes before updating locations.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    setMessage(null);
    
    try {
      // Get token from database
      const { data: token, error: tokenError } = await supabase.rpc('get_shopify_setting', { 
        setting_name_param: 'shopify_token' 
      });
      
      if (tokenError) {
        throw new Error(`Failed to get API token: ${tokenError.message}`);
      }
      
      if (!token) {
        throw new Error("No API token found in settings");
      }
      
      const { data, error } = await supabase.functions.invoke('shopify-locations-sync-v2', {
        body: { apiToken: token }
      });
      
      if (error) {
        throw error;
      }
      
      if (!data.success) {
        throw new Error(data.error || "Unknown error during location update");
      }
      
      toast({
        title: "Batch Location Update Complete",
        description: `Successfully updated ${data.updated} line items with location data`,
        variant: "default",
      });
      
      if (onUpdateComplete) {
        onUpdateComplete();
      }
      
    } catch (error: any) {
      const errorMessage = error.message || "Failed to update locations";
      setMessage(errorMessage);
      
      toast({
        title: "Location Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-orange-500">Batch Location Update</CardTitle>
        <CardDescription className="text-zinc-400">
          Update location information for all line items in active orders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {disabled && (
          <Alert className="bg-amber-900/20 border-amber-500/50">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <AlertTitle className="text-amber-400">Operation Locked</AlertTitle>
            <AlertDescription className="text-zinc-300">
              A data refresh is currently in progress. Please wait until it completes before 
              attempting to update locations.
            </AlertDescription>
          </Alert>
        )}
      
        <Button 
          onClick={handleBatchUpdate} 
          disabled={isUpdating || disabled}
          className="w-full bg-orange-500 hover:bg-orange-600"
        >
          {isUpdating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Updating All Locations...
            </>
          ) : (
            "Update All Locations"
          )}
        </Button>
        
        {message && (
          <Alert className="bg-red-900/20 border-red-500/50">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <AlertTitle className="text-red-400">Error</AlertTitle>
            <AlertDescription className="text-zinc-300">
              {message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default BatchLocationUpdateCard;
