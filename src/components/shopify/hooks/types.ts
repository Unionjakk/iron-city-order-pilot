
export type UseRefreshStateProps = {
  onRefreshComplete: () => Promise<void>;
}

export type UseRefreshStateReturn = {
  isDeleting: boolean;
  setIsDeleting: (value: boolean) => void;
  isImporting: boolean;
  setIsImporting: (value: boolean) => void;
  isSuccess: boolean;
  setIsSuccess: (value: boolean) => void;
  debugInfo: string[];
  setDebugInfo: (value: React.SetStateAction<string[]>) => void;
  error: string | null;
  setError: (value: string | null) => void;
  addDebugMessage: (message: string) => void;
  resetState: () => void;
  toast: any;
  onRefreshComplete: () => Promise<void>;
}

export type UseCompleteRefreshProps = {
  onRefreshComplete: () => Promise<void>;
}

export type UseCompleteRefreshReturn = {
  isDeleting: boolean;
  isImporting: boolean; 
  isSuccess: boolean;
  debugInfo: string[];
  error: string | null;
  isBackgroundProcessing?: boolean;
  handleCompleteRefresh: () => Promise<void>;
  addDebugMessage: (message: string) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
}
