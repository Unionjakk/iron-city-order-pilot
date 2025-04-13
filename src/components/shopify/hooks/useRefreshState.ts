
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface UseRefreshStateProps {
  onRefreshComplete: () => Promise<void>;
}

export interface OrderCounts {
  expected: number;
  imported: number;
  unfulfilled: number;
  partiallyFulfilled: number;
}

export const useRefreshState = ({ onRefreshComplete }: UseRefreshStateProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isBackgroundProcessing, setIsBackgroundProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [orderCounts, setOrderCounts] = useState<OrderCounts>({
    expected: 0,
    imported: 0,
    unfulfilled: 0,
    partiallyFulfilled: 0
  });
  const { toast } = useToast();

  const addDebugMessage = (message: string) => {
    console.log(`[DEBUG] ${message}`);
    setDebugInfo(prev => [message, ...prev].slice(0, 100)); // Keep last 100 messages
  };

  const resetState = () => {
    setIsSuccess(false);
    setIsImporting(false);
    setIsDeleting(false);
    setIsBackgroundProcessing(false);
    setError(null);
    setOrderCounts({
      expected: 0,
      imported: 0,
      unfulfilled: 0,
      partiallyFulfilled: 0
    });
  };

  return {
    isDeleting,
    setIsDeleting,
    isImporting,
    setIsImporting,
    isBackgroundProcessing,
    setIsBackgroundProcessing,
    isSuccess,
    setIsSuccess,
    debugInfo,
    setDebugInfo,
    error,
    setError,
    orderCounts,
    setOrderCounts,
    addDebugMessage,
    resetState,
    toast,
    onRefreshComplete
  };
};
