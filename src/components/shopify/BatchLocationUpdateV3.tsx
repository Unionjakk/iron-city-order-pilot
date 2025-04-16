import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import TabView from '@/components/ui/tab-view';

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
  const [connectionInfo, setConnectionInfo] = useState<string[]>([]);
  const [requestPayloads, setRequestPayloads] = useState<string[]>([]);
  const [responses, setResponses] = useState<string[]>([]);
  const [databaseUpdates, setDatabaseUpdates] = useState<string[]>([]);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
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
          addConnectionInfo(`Estimated ${count} line items need location updates`);
        }
      } catch (error) {
        console.error('Error getting estimated total:', error);
      }
    };

    const edgeFunctionUrl = `https://hbmismnzmocjazaiicdu.supabase.co/functions/v1/shopify-locations-sync-v3`;
    
    addConnectionInfo(`Connection Information:`);
    addConnectionInfo(`Edge Function URL: ${edgeFunctionUrl}`);
    addConnectionInfo(`Shopify API Version: 2023-07`);
    addConnectionInfo(`GraphQL Endpoint: https://opus-harley-davidson.myshopify.com/admin/api/2023-07/graphql.json`);
    addConnectionInfo(`Rate Limiting: 1.5 seconds between requests`);
    addConnectionInfo(`Batch Size: 40 items (restricted to 1 batch for debugging)`);
    
    getEstimatedTotal();
    
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  const addConnectionInfo = (message: string) => {
    console.log(`[Connection]: ${message}`);
    setConnectionInfo(prev => [message, ...prev].slice(0, 100));
  };

  const addRequestPayload = (message: string) => {
    console.log(`[Request]: ${message}`);
    setRequestPayloads(prev => [message, ...prev].slice(0, 100));
  };

  const addResponse = (message: string) => {
    console.log(`[Response]: ${message}`);
    setResponses(prev => [message, ...prev].slice(0, 100));
  };

  const addDatabaseUpdate = (message: string) => {
    console.log(`[Database]: ${message}`);
    setDatabaseUpdates(prev => [message, ...prev].slice(0, 100));
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

  const handleBatchUpdate = async () => {
    if (disabled || isUpdating) {
      toast({
        title: "Operation Blocked",
        description: "Please wait until the current operation completes.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUpdating(true);
    setMessage(null);
    setConnectionInfo([]);
    setRequestPayloads([]);
    setResponses([]);
    setDatabaseUpdates([]);
    setUpdatedCount(0);
    setTotalProcessed(0);
    setIsComplete(false);
    setProgressPercent(0);
    setTimeElapsed(0);
    setRateLimitRemaining(null);
    startTimer();
    
    try {
      addConnectionInfo("Starting batch location update (limited to 1 batch)...");
      
      const { data: token, error: tokenError } = await supabase.rpc('get_shopify_setting', { 
        setting_name_param: 'shopify_token' 
      });
      
      if (tokenError) {
        throw new Error(`Failed to get API token: ${tokenError.message}`);
      }
      
      if (!token) {
        throw new Error("No API token found in settings");
      }
      
      addConnectionInfo(`API Token retrieved (length: ${token.length})`);
      addConnectionInfo(`Calling Shopify locations sync V3 edge function...`);
      
      const requestPayload = { 
        apiToken: token,
        continuationToken: null
      };
      
      addRequestPayload(`Request payload: ${JSON.stringify(requestPayload, null, 2)}`);
      
      const { data, error } = await supabase.functions.invoke('shopify-locations-sync-v3', {
        body: requestPayload
      });
      
      addResponse(`Response: ${JSON.stringify(data, null, 2)}`);
      
      if (error) {
        throw error;
      }
      
      if (!data.success) {
        throw new Error(data.error || "Unknown error during location update");
      }
      
      if (data.rateLimitRemaining !== undefined) {
        setRateLimitRemaining(data.rateLimitRemaining);
        addConnectionInfo(`API Rate limit: ${data.rateLimitRemaining}`);
      }
      
      setUpdatedCount(data.updated);
      setTotalProcessed(data.totalProcessed);
      setTimeElapsed(data.timeElapsed || timeElapsed);
      
      const total = estimatedTotal || 1000;
      const processed = data.totalProcessed;
      const progressPercent = Math.min(Math.round((processed / total) * 100), 99);
      
      setProgressPercent(progressPercent);
      
      if (data.processingComplete) {
        addDatabaseUpdate(`Completed! Successfully updated ${data.updated} line items.`);
        setIsComplete(true);
        setProgressPercent(100);
        stopTimer();
        
        toast({
          title: "Location Update Complete",
          description: `Successfully updated ${data.updated} of ${data.totalProcessed} line items in ${data.timeElapsed.toFixed(1)}s`,
          variant: "default",
        });
        
        if (onUpdateComplete) {
          addConnectionInfo("Refreshing data...");
          await onUpdateComplete();
        }
      } else {
        // We're forcing completion here even if there are more batches to process
        addConnectionInfo(`Batch complete. Only processing 1 batch for debugging.`);
        addDatabaseUpdate(`Updated ${data.updated} line items in this batch.`);
        setIsComplete(true);
        stopTimer();
      }
    } catch (error: any) {
      console.error('Error in batch location update:', error);
      stopTimer();
      setIsComplete(false);
      setMessage(error.message);
      addResponse(`Error: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const renderLogEntries = (entries: string[]) => {
    return (
      <div className="font-mono text-xs">
        {entries.map((entry, index) => (
          <div key={index} className="py-1 border-b border-zinc-800/50 last:border-0 whitespace-pre-wrap">
            {entry}
          </div>
        ))}
        {entries.length === 0 && (
          <div className="text-zinc-500 italic">No logs available</div>
        )}
      </div>
    );
  };

  const tabs = [
    {
      id: "connection",
      label: "Connection Info",
      content: renderLogEntries(connectionInfo)
    },
    {
      id: "request",
      label: "Request Payloads",
      content: renderLogEntries(requestPayloads)
    },
    {
      id: "response",
      label: "API Responses",
      content: renderLogEntries(responses)
    },
    {
      id: "database",
      label: "Database Updates",
      content: renderLogEntries(databaseUpdates)
    }
  ];

  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-orange-500">Batch Location Update (Debug Mode)</CardTitle>
        <CardDescription className="text-zinc-400">
          Update location information for all line items using the GraphQL API (limited to 1 batch)
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
          onClick={handleBatchUpdate}
          disabled={disabled || isUpdating}
          className="w-full"
          variant={isComplete ? "outline" : "default"}
        >
          {isUpdating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Updating Locations (Debug Mode)...
            </>
          ) : isComplete ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
              Run Again (Debug Mode)
            </>
          ) : (
            "Update Locations (Debug Mode - Single Batch)"
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
        
        <TabView tabs={tabs} />
      </CardContent>
    </Card>
  );
};

export default BatchLocationUpdateV3;
