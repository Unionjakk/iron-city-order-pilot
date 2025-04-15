
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import DebugInfoPanel from './DebugInfoPanel';

interface BatchLocationUpdateV2Props {
  disabled?: boolean;
}

const BatchLocationUpdateV2: React.FC<BatchLocationUpdateV2Props> = ({ disabled = false }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [continuationToken, setContinuationToken] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const { toast } = useToast();

  const addDebugMessage = (message: string) => {
    setDebugInfo(prev => [message, ...prev]);
  };

  const handleBatchUpdate = async (continueFromToken?: string) => {
    if (disabled) {
      toast({
        title: "Operation Blocked",
        description: "Please wait until the current refresh operation completes before updating locations.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    
    if (!continueFromToken) {
      // Starting fresh
      setMessage(null);
      setDebugInfo([]);
      setUpdatedCount(0);
      setIsComplete(false);
      setProgressPercent(0);
      setTimeElapsed(0);
    }
    
    try {
      addDebugMessage(continueFromToken 
        ? "Continuing batch location update..." 
        : "Starting batch location update for all orders...");
      
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
      
      addDebugMessage("Calling Shopify locations sync V2 edge function...");
      
      const { data, error } = await supabase.functions.invoke('shopify-locations-sync-v2', {
        body: { 
          apiToken: token,
          continuationToken: continueFromToken || undefined
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (!data.success) {
        throw new Error(data.error || "Unknown error during location update");
      }
      
      setUpdatedCount(data.updated);
      setTimeElapsed(data.timeElapsed);
      setContinuationToken(data.continuationToken);
      
      // Determine if we're done or need to continue
      if (data.processingComplete) {
        addDebugMessage(`Successfully completed updating ${data.updated} line items with location data`);
        setIsComplete(true);
        setProgressPercent(100);
        
        toast({
          title: "Batch Location Update Complete",
          description: `Successfully updated ${data.updated} line items with location data in ${data.timeElapsed.toFixed(1)}s`,
          variant: "default",
        });
      } else {
        // More batches to process
        const batchNumber = JSON.parse(data.continuationToken).batchNumber;
        setProgressPercent(Math.min(95, batchNumber * 5)); // Approximation
        
        addDebugMessage(`Processed batch ${batchNumber - 1}. Updated ${data.updated} line items so far.`);
        
        // Automatically continue with the next batch
        setTimeout(() => {
          handleBatchUpdate(data.continuationToken);
        }, 1000);
      }
      
    } catch (error: any) {
      const errorMessage = error.message || "Failed to update locations";
      addDebugMessage(`ERROR: ${errorMessage}`);
      setMessage(errorMessage);
      setIsComplete(false);
      
      toast({
        title: "Location Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      setIsUpdating(false);
    }
    
    // Only set isUpdating to false when fully complete
    if (isComplete) {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Batch Location Update V2</CardTitle>
        <CardDescription>
          Efficiently update location information for all line items using the improved V2 implementation
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
      
        {isUpdating && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm text-zinc-400">
              <span>Processing updates... {updatedCount} items updated</span>
              <span>{timeElapsed.toFixed(1)}s elapsed</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}
        
        <Button 
          onClick={() => handleBatchUpdate()} 
          disabled={isUpdating || disabled}
          className="w-full"
        >
          {isUpdating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Updating Locations...
            </>
          ) : isComplete ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
              Update Complete - Run Again
            </>
          ) : (
            "Update All Locations (V2)"
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
            <h3 className="text-sm font-medium mb-2">Processing Log</h3>
            <DebugInfoPanel debugInfo={debugInfo} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BatchLocationUpdateV2;
