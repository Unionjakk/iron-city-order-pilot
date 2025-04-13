
import { useRefreshState } from './useRefreshState';
import { useImportOperation } from './useImportOperation';
import { useCompleteRefreshOperation } from './useCompleteRefreshOperation';
import type { UseCompleteRefreshProps, UseCompleteRefreshReturn } from './types';

export type { UseCompleteRefreshProps };

export const useCompleteRefresh = ({ onRefreshComplete }: UseCompleteRefreshProps): UseCompleteRefreshReturn => {
  // Use state management hook
  const refreshState = useRefreshState({ onRefreshComplete });
  
  // Use specialized operation hooks
  const { handleCompleteRefresh } = useCompleteRefreshOperation(refreshState);
  const { isBackgroundProcessing } = useImportOperation(refreshState);

  // Extract needed state values
  const {
    isDeleting,
    isImporting,
    isSuccess, 
    debugInfo,
    error,
    addDebugMessage,
    setError,
    resetState
  } = refreshState;

  // Return the complete interface
  return {
    isDeleting,
    isImporting,
    isSuccess,
    debugInfo,
    error,
    isBackgroundProcessing,
    handleCompleteRefresh,
    addDebugMessage,
    setError,
    resetState
  };
};
