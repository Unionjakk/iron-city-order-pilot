
import { useRefreshState } from './useRefreshState';
import { useImportOperation } from './useImportOperation';
import { useCompleteRefreshOperation } from './useCompleteRefreshOperation';
import { UseCompleteRefreshProps, UseCompleteRefreshReturn } from './types';

export { UseCompleteRefreshProps };

export const useCompleteRefresh = ({ onRefreshComplete }: UseCompleteRefreshProps): UseCompleteRefreshReturn => {
  // Use state management hook
  const refreshState = useRefreshState({ onRefreshComplete });
  
  // Use specialized operation hooks
  const { handleImportOnly } = useImportOperation(refreshState);
  const { handleCompleteRefresh } = useCompleteRefreshOperation(refreshState);

  // Extract needed state values
  const {
    isDeleting,
    isImporting,
    isSuccess, 
    debugInfo,
    error,
    isRecoveryMode,
    addDebugMessage,
    setError,
    setIsRecoveryMode,
    resetState
  } = refreshState;

  // Return the complete interface
  return {
    isDeleting,
    isImporting,
    isSuccess,
    debugInfo,
    error,
    isRecoveryMode,
    handleCompleteRefresh,
    handleRecoveryImport: handleImportOnly,
    addDebugMessage,
    setError,
    setIsRecoveryMode,
    resetState
  };
};
