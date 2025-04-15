import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import DebugInfoPanel from './DebugInfoPanel';

interface BatchLocationUpdateV3Props {
  disabled?: boolean;
  onUpdateComplete?: () => Promise<void>;
}

const BatchLocationUpdateV3: React.FC<BatchLocationUpdateV3Props> = ({ 
  disabled = false,
  onUpdateComplete
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [continuationToken, setContinuationToken] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [estimatedTotal, setEstimatedTotal] = useState(0);
  const [rateLimitRemaining, setRateLimitRemaining] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getEstimatedTotal = async () => {
      try {
        const { count } = await supabase
          .from('shopify_order_items')
          .select('*', { count: 'exact', head: true })
          .is('location_id', null);
        
        if (count !== null) {
          setEstimatedTotal(count);
          addDebugMessage(`Estimated ${count} line items need location updates`);
        }
      } catch (error) {
        console.error('Error getting estimated total:', error);
      }
    };

    getEstimatedTotal();
    
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  const addDebugMessage = (message: string) => {
    console.log(message);
    setDebugInfo(prev => [message, ...prev].slice(0, 100));
  };

  const startTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
    
    const startTime = Date.now() - (timeElapsed * 1000);
    
    timerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setTimeElapsed(elapsed);
    }, 1000) as unknown as number;
  };

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleBatchUpdate = async (continueFromToken?: string | null) => {
    if (disabled || (isUpdating && !continueFromToken)) {
      toast({
        title: "Operation Blocked",
        description: "Please wait until the current operation completes.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUpdating(true);
    
    if (!continueFromToken) {
      setMessage(null);
      setDebugInfo([]);
      setUpdatedCount(0);
      setTotalProcessed(0);
      setIsComplete(false);
      setContinuationToken(null);
      setProgressPercent(0);
      setTimeElapsed(0);
      setRateLimitRemaining(null);
      startTimer();
    }
    
    try {
      addDebugMessage(continueFromToken 
        ? "Continuing batch location update..." 
        : "Starting batch location update for all orders...");
      
      const { data: token, error: tokenError } = await supabase.rpc('get_shopify_setting', { 
        setting_name_param: 'shopify_token' 
      });
      
      if (tokenError) {
        throw new Error(`Failed to get API token: ${tokenError.message}`);
      }
      
      if (!token) {
        throw new Error("No API token found in settings");
      }
      
      addDebugMessage("Calling Shopify locations sync V3 edge function...");
      
      const { data, error } = await supabase.functions.invoke('shopify-locations-sync-v3', {
        body: { 
          apiToken: token,
          continuationToken: continueFromToken
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (!data.success) {
        throw new Error(data.error || "Unknown error during location update");
      }
      
      if (data.rateLimitRemaining !== undefined) {
        setRateLimitRemaining(data.rateLimitRemaining);
        addDebugMessage(`API Rate limit: ${data.rateLimitRemaining}`);
      }
      
      setUpdatedCount(data.updated);
      setTotalProcessed(data.totalProcessed);
      setTimeElapsed(data.timeElapsed || timeElapsed);
      
      const total = estimatedTotal || 1000;
      const processed = data.totalProcessed;
      const progressPercent = Math.min(Math.round((processed / total) * 100), 99);
      
      setProgressPercent(progressPercent);
      addDebugMessage(`Progress: ${progressPercent}% (${processed}/${total} items)`);
      
      if (data.processingComplete) {
        addDebugMessage(`✅ Completed! Successfully updated ${data.updated} line items.`);
        setIsComplete(true);
        setProgressPercent(100);
        stopTimer();
        
        toast({
          title: "Location Update Complete",
          description: `Successfully updated ${data.updated} of ${data.totalProcessed} line items in ${data.timeElapsed.toFixed(1)}s`,
          variant: "default",
        });
        
        if (onUpdateComplete) {
          addDebugMessage("Refreshing data...");
          await onUpdateComplete();
        }
        
        setIsUpdating(false);
      } else {
        setContinuationToken(data.continuationToken);
        setTimeout(() => handleBatchUpdate(data.continuationToken), 100);
      }
    } catch (error: any) {
      console.error('Error in batch location update:', error);
      stopTimer();
      setIsComplete(false);
      setIsUpdating(false);
      
      const errorMessage = error.message || "Unknown error occurred";
      setMessage(errorMessage);
      addDebugMessage(`Error: ${errorMessage}`);
      
      if (!isComplete) {
        addDebugMessage("Will auto-restart in 5 seconds...");
        setTimeout(() => handleBatchUpdate(continuationToken), 5000);
      }
      
      toast({
        title: "Location Update Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-orange-500">Batch Location Update</CardTitle>
        <CardDescription className="text-zinc-400">
          Update location information for all line items using the GraphQL API
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
              <span>{updatedCount} items updated</span>
              <span>{timeElapsed.toFixed(1)}s elapsed</span>
            </div>
            {rateLimitRemaining !== null && (
              <div className="text-xs text-amber-400/80">
                API rate limit: {rateLimitRemaining}
              </div>
            )}
            <Progress value={progressPercent} className="h-2" />
            {estimatedTotal > 0 && (
              <div className="text-xs text-zinc-500">
                Progress: approximately {progressPercent}% complete 
                ({totalProcessed}/{estimatedTotal} estimated items)
              </div>
            )}
          </div>
        )}
        
        <Button 
          onClick={() => handleBatchUpdate(continuationToken)}
          disabled={disabled}
          className="w-full"
          variant={isComplete ? "outline" : "default"}
        >
          {isUpdating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Updating Locations...
            </>
          ) : isComplete ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
              Run Again
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
            <h3 className="text-sm font-medium mb-2">Processing Log</h3>
            <DebugInfoPanel debugInfo={debugInfo} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BatchLocationUpdateV3;
