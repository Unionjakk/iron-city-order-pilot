
import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getShopifyToken, getEstimatedTotal, invokeBatchLocationSync } from '../utils/locationSyncApi';

export interface BatchUpdateState {
  isUpdating: boolean;
  message: string | null;
  updatedCount: number;
  totalProcessed: number;
  isComplete: boolean;
  progressPercent: number;
  timeElapsed: number;
  estimatedTotal: number;
}

export const useBatchLocationUpdate = (
  disabled: boolean = false,
  onUpdateComplete?: () => Promise<void>
) => {
  const [state, setState] = useState<BatchUpdateState>({
    isUpdating: false,
    message: null,
    updatedCount: 0,
    totalProcessed: 0,
    isComplete: false,
    progressPercent: 0,
    timeElapsed: 0,
    estimatedTotal: 0
  });

  const continuationTokenRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const { toast } = useToast();

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
        }
      } catch (error) {
        console.error('Error getting estimated total:', error);
      }
    };

    initializeEstimatedTotal();

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  const processBatch = async (token: string): Promise<boolean> => {
    const { data, error } = await invokeBatchLocationSync(token, continuationTokenRef.current);
    
    if (error) {
      throw error;
    }
    
    if (!data.success) {
      throw new Error(data.error || "Unknown error during location update");
    }
    
    setState(prev => ({
      ...prev,
      updatedCount: data.updated,
      totalProcessed: data.totalProcessed,
      timeElapsed: data.timeElapsed || prev.timeElapsed,
      progressPercent: Math.min(Math.round((data.totalProcessed / (prev.estimatedTotal || 1000)) * 100), 99)
    }));

    if (data.processingComplete) {
      setState(prev => ({ 
        ...prev, 
        isComplete: true, 
        progressPercent: 100 
      }));
      return true;
    }

    if (data.continuationToken) {
      continuationTokenRef.current = data.continuationToken;
    }

    return false;
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
      updatedCount: 0,
      totalProcessed: 0,
      isComplete: false,
      progressPercent: 0,
      timeElapsed: 0
    }));

    continuationTokenRef.current = null;
    startTimer();
    
    try {
      const token = await getShopifyToken();
      let isComplete = false;

      while (!isComplete) {
        isComplete = await processBatch(token);
      }

      stopTimer();
      
      toast({
        title: "Location Update Complete",
        description: `Successfully updated ${state.updatedCount} of ${state.totalProcessed} line items`,
        variant: "default",
      });
      
      if (onUpdateComplete) {
        await onUpdateComplete();
      }
    } catch (error: any) {
      console.error('Error in batch location update:', error);
      stopTimer();
      setState(prev => ({ 
        ...prev,
        isComplete: false,
        message: error.message
      }));
    } finally {
      setState(prev => ({ ...prev, isUpdating: false }));
    }
  };

  return {
    state,
    handleBatchUpdate,
  };
};
