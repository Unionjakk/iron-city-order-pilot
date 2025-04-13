
export interface UseRefreshStateProps {
  onRefreshComplete: () => Promise<void>;
}

export interface UseRefreshStateReturn {
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
  isRecoveryMode: boolean;
  setIsRecoveryMode: (value: boolean) => void;
  addDebugMessage: (message: string) => void;
  resetState: () => void;
  toast: any;
  onRefreshComplete: () => Promise<void>;
}

export interface UseCompleteRefreshProps {
  onRefreshComplete: () => Promise<void>;
}

export interface UseCompleteRefreshReturn {
  isDeleting: boolean;
  isImporting: boolean; 
  isSuccess: boolean;
  debugInfo: string[];
  error: string | null;
  isRecoveryMode: boolean;
  handleCompleteRefresh: () => Promise<void>;
  handleRecoveryImport: () => Promise<void>;
  addDebugMessage: (message: string) => void;
  setError: (error: string | null) => void;
  setIsRecoveryMode: (value: boolean) => void;
  resetState: () => void;
}
