
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, CheckCircle2, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import DebugInfoPanel from './DebugInfoPanel';

interface BatchLocationUpdateV3Props {
  disabled?: boolean;
  onUpdateComplete?: () => Promise<void>;
}

type ContinuationToken = {
  lastProcessedId: string | null;
  batchSize: number;
  updatedCount: number;
  totalProcessed: number;
  startTime: number;
};

const BatchLocationUpdateV3: React.FC<BatchLocationUpdateV3Props> = ({ 
  disabled = false,
  onUpdateComplete
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
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

  // Get estimated total when component mounts
  useEffect(() => {
    // Get estimated total number of line items to update
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
    
    // Cleanup timer on unmount
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

  // Start a timer to update elapsed time
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

  // Stop the timer
  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handlePauseResume = () => {
    if (isPaused) {
      // Resume the operation
      setIsPaused(false);
      addDebugMessage("Resuming batch location update...");
      handleBatchUpdate(continuationToken);
      startTimer();
    } else {
      // Pause the operation
      setIsPaused(true);
      stopTimer();
      addDebugMessage("Pausing batch location update. Click Resume to continue.");
      toast({
        title: "Process Paused",
        description: "Location update has been paused. Click Resume to continue.",
      });
    }
  };

  const handleBatchUpdate = async (continueFromToken?: string | null) => {
    if (disabled || (isUpdating && !isPaused)) {
      toast({
        title: "Operation Blocked",
        description: "Please wait until the current operation completes.",
        variant: "destructive",
      });
      return;
    }

    if (isPaused) {
      return handlePauseResume();
    }
    
    setIsUpdating(true);
    setIsPaused(false);
    
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
      
      // Check if there's a token stored
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
      
      // Track rate limiting if available
      if (data.rateLimitRemaining !== undefined) {
        setRateLimitRemaining(data.rateLimitRemaining);
        addDebugMessage(`API Rate limit: ${data.rateLimitRemaining}`);
      }
      
      setUpdatedCount(data.updated);
      setTotalProcessed(data.totalProcessed);
      setTimeElapsed(data.timeElapsed || timeElapsed);
      
      // Calculate progress percentage
      const total = estimatedTotal || 1000; // Use estimated total or fallback
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
        // Continue with the next batch after a short delay
        setContinuationToken(data.continuationToken);
        
        // Only continue if not paused
        if (!isPaused) {
          setTimeout(() => {
            if (!isPaused) {
              handleBatchUpdate(data.continuationToken);
            }
          }, 100);
        }
      }
    } catch (error: any) {
      console.error('Error in batch location update:', error);
      stopTimer();
      setIsComplete(false);
      setIsPaused(false);
      setIsUpdating(false);
      
      const errorMessage = error.message || "Unknown error occurred";
      setMessage(errorMessage);
      addDebugMessage(`Error: ${errorMessage}`);
      
      toast({
        title: "Location Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-orange-500">Batch Location Update V3</CardTitle>
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
        
        <div className="flex gap-2">
          <Button 
            onClick={() => handleBatchUpdate(continuationToken)}
            disabled={disabled || (isUpdating && !isPaused)}
            className="w-full"
            variant={isComplete ? "outline" : "default"}
          >
            {isUpdating && !isPaused ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Updating Locations...
              </>
            ) : isPaused ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Resume Update
              </>
            ) : isComplete ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                Run Again
              </>
            ) : continuationToken ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Continue Update
              </>
            ) : (
              "Update All Locations"
            )}
          </Button>
          
          {isUpdating && !isComplete && (
            <Button 
              onClick={handlePauseResume}
              variant="outline"
              className="w-auto"
            >
              {isPaused ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        
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
