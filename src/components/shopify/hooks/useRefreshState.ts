
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface UseRefreshStateProps {
  onRefreshComplete: () => Promise<void>;
}

export const useRefreshState = ({ onRefreshComplete }: UseRefreshStateProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const addDebugMessage = (message: string) => {
    console.log(`[DEBUG] ${message}`);
    setDebugInfo(prev => [message, ...prev].slice(0, 100)); // Keep last 100 messages
  };

  const resetState = () => {
    setIsSuccess(false);
    setIsImporting(false);
    setIsDeleting(false);
    setError(null);
  };

  return {
    isDeleting,
    setIsDeleting,
    isImporting,
    setIsImporting,
    isSuccess,
    setIsSuccess,
    debugInfo,
    setDebugInfo,
    error,
    setError,
    addDebugMessage,
    resetState,
    toast,
    onRefreshComplete
  };
};
