
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DebugInfoPanel from './DebugInfoPanel';

interface BatchLocationUpdateProps {
  disabled?: boolean;
}

const BatchLocationUpdate: React.FC<BatchLocationUpdateProps> = ({ disabled = false }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const { toast } = useToast();

  const addDebugMessage = (message: string) => {
    setDebugInfo(prev => [message, ...prev]);
  };

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
    setDebugInfo([]);
    
    try {
      addDebugMessage("Starting batch location update for all orders...");
      
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
      
      addDebugMessage("Calling Shopify locations sync edge function...");
      
      const { data, error } = await supabase.functions.invoke('shopify-locations-sync', {
        body: { apiToken: token }
      });
      
      if (error) {
        throw error;
      }
      
      if (!data.success) {
        throw new Error(data.error || "Unknown error during location update");
      }
      
      addDebugMessage(`Successfully updated ${data.updated} line items with location data`);
      
      if (data.debugMessages && Array.isArray(data.debugMessages)) {
        data.debugMessages.forEach((msg: string) => addDebugMessage(msg));
      }
      
      toast({
        title: "Batch Location Update Complete",
        description: `Successfully updated ${data.updated} line items with location data`,
        variant: "default",
      });
      
    } catch (error: any) {
      const errorMessage = error.message || "Failed to update locations";
      addDebugMessage(`ERROR: ${errorMessage}`);
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
        <CardTitle>Batch Location Update</CardTitle>
        <CardDescription>
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
          className="w-full"
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
        
        {debugInfo.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Debug Information</h3>
            <DebugInfoPanel debugInfo={debugInfo} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BatchLocationUpdate;
