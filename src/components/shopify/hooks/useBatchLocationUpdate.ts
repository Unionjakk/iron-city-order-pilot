import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getShopifyToken, getEstimatedTotal, invokeBatchLocationSync } from '../utils/locationSyncApi';
import { LocationSyncLogger } from '../utils/locationSyncLogger';

export interface BatchUpdateState {
  isUpdating: boolean;
  message: string | null;
  connectionInfo: string[];
  requestPayloads: string[];
  responses: string[];
  databaseUpdates: string[];
  updatedCount: number;
  totalProcessed: number;
  isComplete: boolean;
  progressPercent: number;
  timeElapsed: number;
  estimatedTotal: number;
  rateLimitRemaining: string | null;
}

export const useBatchLocationUpdate = (
  disabled: boolean = false,
  onUpdateComplete?: () => Promise<void>
) => {
  const [state, setState] = useState<BatchUpdateState>({
    isUpdating: false,
    message: null,
    connectionInfo: [],
    requestPayloads: [],
    responses: [],
    databaseUpdates: [],
    updatedCount: 0,
    totalProcessed: 0,
    isComplete: false,
    progressPercent: 0,
    timeElapsed: 0,
    estimatedTotal: 0,
    rateLimitRemaining: null
  });

  const timerRef = useRef<number | null>(null);
  const { toast } = useToast();

  const addToLogs = (type: keyof Pick<BatchUpdateState, 'connectionInfo' | 'requestPayloads' | 'responses' | 'databaseUpdates'>) => 
    (message: string) => {
      setState(prev => ({
        ...prev,
        [type]: [message, ...prev[type]].slice(0, 100)
      }));
    };

  const startTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
    
    const startTime = Date.now() - (state.timeElapsed * 1000);
    
    timerRef.current = window.setInterval(() => {
      setState(prev => ({
        ...prev,
        timeElapsed: (Date.now() - startTime) / 1000
      }));
    }, 1000) as unknown as number;
  };

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    const initializeEstimatedTotal = async () => {
      try {
        const count = await getEstimatedTotal();
        if (count !== null) {
          setState(prev => ({ ...prev, estimatedTotal: count }));
          LocationSyncLogger.logConnection(
            `Estimated ${count} line items need location updates`,
            addToLogs('connectionInfo')
          );
        }
      } catch (error) {
        console.error('Error getting estimated total:', error);
      }
    };

    const logInitialInfo = () => {
      const edgeFunctionUrl = `https://hbmismnzmocjazaiicdu.supabase.co/functions/v1/shopify-locations-sync-v3`;
      
      LocationSyncLogger.logConnection(`Connection Information:`, addToLogs('connectionInfo'));
      LocationSyncLogger.logConnection(`Edge Function URL: ${edgeFunctionUrl}`, addToLogs('connectionInfo'));
      LocationSyncLogger.logConnection(`Shopify API Version: 2023-07`, addToLogs('connectionInfo'));
      LocationSyncLogger.logConnection(`GraphQL Endpoint: https://opus-harley-davidson.myshopify.com/admin/api/2023-07/graphql.json`, addToLogs('connectionInfo'));
      LocationSyncLogger.logConnection(`Rate Limiting: 1.5 seconds between requests`, addToLogs('connectionInfo'));
      LocationSyncLogger.logConnection(`Batch Size: 40 items (restricted to 1 batch for debugging)`, addToLogs('connectionInfo'));
      LocationSyncLogger.logConnection(`GraphQL Query Structure:`, addToLogs('connectionInfo'));
      LocationSyncLogger.logConnection(`- Using inventoryLevels(first: 5) instead of inventoryLevel`, addToLogs('connectionInfo'));
      LocationSyncLogger.logConnection(`- Reading line items from fulfillmentOrders using edges->node->lineItem->id pattern`, addToLogs('connectionInfo'));
    };

    logInitialInfo();
    initializeEstimatedTotal();

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  const processBatch = async (continuationToken: string | null = null) => {
    try {
      const token = await getShopifyToken();
      
      LocationSyncLogger.logConnection(
        `Calling Shopify locations sync V3 edge function${continuationToken ? ' with continuation token' : ''}...`, 
        addToLogs('connectionInfo')
      );
      
      const requestPayload = { 
        apiToken: token,
        continuationToken
      };
      
      LocationSyncLogger.logRequest(
        `Request payload: ${JSON.stringify(requestPayload, null, 2)}`, 
        addToLogs('requestPayloads')
      );
      
      const { data } = await invokeBatchLocationSync(token, continuationToken);
      
      if (data) {
        LocationSyncLogger.logResponse(
          `Response: ${JSON.stringify(data, null, 2)}`, 
          addToLogs('responses')
        );
        
        setState(prev => ({
          ...prev,
          rateLimitRemaining: data.rateLimitRemaining,
          updatedCount: data.updated,
          totalProcessed: data.totalProcessed,
          timeElapsed: data.timeElapsed || prev.timeElapsed,
          progressPercent: Math.min(Math.round((data.totalProcessed / (prev.estimatedTotal || 1000)) * 100), 99)
        }));

        if (data.rateLimitRemaining !== undefined) {
          LocationSyncLogger.logConnection(
            `API Rate limit: ${data.rateLimitRemaining}`, 
            addToLogs('connectionInfo')
          );
        }
        
        if (data.processingComplete) {
          LocationSyncLogger.logDatabase(
            `Completed! Successfully updated ${data.updated} line items.`, 
            addToLogs('databaseUpdates')
          );
          setState(prev => ({ ...prev, isComplete: true, progressPercent: 100 }));
          stopTimer();
          
          toast({
            title: "Location Update Complete",
            description: `Successfully updated ${data.updated} of ${data.totalProcessed} line items in ${data.timeElapsed.toFixed(1)}s`,
            variant: "default",
          });
          
          if (onUpdateComplete) {
            LocationSyncLogger.logConnection("Refreshing data...", addToLogs('connectionInfo'));
            await onUpdateComplete();
          }
        } else {
          LocationSyncLogger.logConnection(
            `Batch complete. Processing next batch...`, 
            addToLogs('connectionInfo')
          );
          LocationSyncLogger.logDatabase(
            `Updated ${data.updated} line items in this batch.`, 
            addToLogs('databaseUpdates')
          );
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          await processBatch(data.continuationToken);
        }
      } else {
        LocationSyncLogger.logConnection(
          "No data in response, continuing with next batch...",
          addToLogs('connectionInfo')
        );
        await new Promise(resolve => setTimeout(resolve, 2000));
        await processBatch(null);
      }
    } catch (error: any) {
      console.error('Error in batch location update:', error);
      LocationSyncLogger.logResponse(`Error: ${error.message}`, addToLogs('responses'));
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      await processBatch(null);
    }
  };

  const handleBatchUpdate = async () => {
    if (disabled || state.isUpdating) {
      toast({
        title: "Operation Blocked",
        description: "Please wait until the current operation completes.",
        variant: "destructive",
      });
      return;
    }

    setState(prev => ({
      ...prev,
      isUpdating: true,
      message: null,
      connectionInfo: [],
      requestPayloads: [],
      responses: [],
      databaseUpdates: [],
      updatedCount: 0,
      totalProcessed: 0,
      isComplete: false,
      progressPercent: 0,
      timeElapsed: 0,
      rateLimitRemaining: null
    }));

    startTimer();
    
    LocationSyncLogger.logConnection(
      "Starting continuous batch location update...", 
      addToLogs('connectionInfo')
    );
    
    await processBatch(null);
    
    setState(prev => ({ ...prev, isUpdating: false }));
  };

  return {
    state,
    handleBatchUpdate,
  };
};
