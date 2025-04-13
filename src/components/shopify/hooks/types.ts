
import { OrderCounts } from './useRefreshState';

export interface UseImportOperationProps {
  refreshState: UseRefreshStateReturn;
}

export interface UseImportOperationReturn {
  isBackgroundProcessing: boolean;
}

export interface UseCompleteRefreshProps {
  onRefreshComplete: () => Promise<void>;
  onRefreshStatusChange?: (isRefreshing: boolean) => void;
}

export interface UseCompleteRefreshReturn {
  isDeleting: boolean;
  isImporting: boolean;
  isSuccess: boolean;
  isBackgroundProcessing: boolean;
  debugInfo: string[];
  error: string | null;
  orderCounts: OrderCounts;
  handleCompleteRefresh: () => Promise<void>;
  addDebugMessage: (message: string) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
}

export interface UseRefreshStateReturn {
  isDeleting: boolean;
  setIsDeleting: (isDeleting: boolean) => void;
  isImporting: boolean;
  setIsImporting: (isImporting: boolean) => void;
  isBackgroundProcessing: boolean;
  setIsBackgroundProcessing: (isBackgroundProcessing: boolean) => void;
  isSuccess: boolean;
  setIsSuccess: (isSuccess: boolean) => void;
  debugInfo: string[];
  setDebugInfo: (debugInfo: string[]) => void;
  error: string | null;
  setError: (error: string | null) => void;
  orderCounts: OrderCounts;
  setOrderCounts: (orderCounts: OrderCounts) => void;
  addDebugMessage: (message: string) => void;
  resetState: () => void;
  toast: any;
  onRefreshComplete: () => Promise<void>;
}

export interface UseCompleteRefreshOperationReturn {
  handleCompleteRefresh: () => Promise<void>;
}
