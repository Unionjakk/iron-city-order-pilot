import { Button } from "@/components/ui/button";
import { RefreshCw, Trash2, CheckCircle2, AlertTriangle, AlertCircle, Clock, Database } from "lucide-react";
import { useState, useEffect } from "react";

interface RefreshButtonProps {
  isDeleting: boolean;
  isImporting: boolean;
  isSuccess: boolean;
  expectedTotal?: number;
  actualTotal?: number;
  unfulfilled?: number;
  partialFulfilled?: number;
  isMismatch?: boolean;
  onClick: () => void;
}

const RefreshButton = ({ 
  isDeleting, 
  isImporting, 
  isSuccess, 
  expectedTotal, 
  actualTotal, 
  unfulfilled, 
  partialFulfilled,
  isMismatch,
  onClick 
}: RefreshButtonProps) => {
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState<Date | null>(null);
  const [timeoutActive, setTimeoutActive] = useState(false);
  const [operationStartTime, setOperationStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>('0s');
  const [showExtendedTimeoutWarning, setShowExtendedTimeoutWarning] = useState(false);

  // Reset the disabled state after a period to prevent permanent disabling on error
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isDeleting || isImporting) {
      if (!operationStartTime) {
        setOperationStartTime(new Date());
      }
      
      setIsButtonDisabled(true);
      
      // Show extended timeout warning after 60 seconds
      const extendedTimeoutWarning = setTimeout(() => {
        if (isDeleting || isImporting) {
          setShowExtendedTimeoutWarning(true);
        }
      }, 60000);
      
      // Auto-enable after 5 minutes to prevent being permanently stuck
      // Only if there's no data mismatch
      timeout = setTimeout(() => {
        // Only auto-enable if there's no mismatch between expected and actual counts
        if (!isMismatch) {
          setIsButtonDisabled(false);
          setTimeoutActive(false);
        }
      }, 300000);
      setTimeoutActive(true);
      
      return () => {
        clearTimeout(timeout);
        clearTimeout(extendedTimeoutWarning);
      };
    } else {
      // If operation is not running but there's a data mismatch, keep button disabled
      if (isMismatch) {
        setIsButtonDisabled(true);
        setTimeoutActive(true);
        return;
      }
      
      // Small delay before re-enabling button after operation completes
      timeout = setTimeout(() => {
        setIsButtonDisabled(false);
        setTimeoutActive(false);
        setShowExtendedTimeoutWarning(false);
      }, 2000);
      
      // Reset operation start time if operation completed
      if (!isDeleting && !isImporting && operationStartTime) {
        setOperationStartTime(null);
      }
      
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [isDeleting, isImporting, isSuccess, operationStartTime, isMismatch]);

  // Update elapsed time every second when an operation is in progress
  useEffect(() => {
    if (!operationStartTime) {
      setElapsedTime('0s');
      return;
    }
    
    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - operationStartTime.getTime()) / 1000);
      
      if (elapsed < 60) {
        setElapsedTime(`${elapsed}s`);
      } else {
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        setElapsedTime(`${minutes}m ${seconds}s`);
      }
      
      // If it's taking longer than 2 minutes, show extended time warning
      if (elapsed > 120 && !showExtendedTimeoutWarning) {
        setShowExtendedTimeoutWarning(true);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [operationStartTime, showExtendedTimeoutWarning]);

  const getButtonText = () => {
    if (isDeleting) return "Deleting All Data...";
    if (isImporting) return "Importing ONLY Active Unfulfilled & Partial Orders...";
    if (isSuccess && isMismatch) return "Import Incomplete - Data Verification Failed";
    if (isSuccess) return "Import Completed Successfully";
    if (errorCount > 0) return "Error Occurred - Click to Try Again";
    return "Delete All & Import ONLY Active Unfulfilled Orders";
  };

  const getIcon = () => {
    if (isDeleting) return <Trash2 className="mr-2 h-4 w-4 animate-spin" />;
    if (isImporting) return <RefreshCw className="mr-2 h-4 w-4 animate-spin" />;
    if (isSuccess && isMismatch) return <AlertTriangle className="mr-2 h-4 w-4 text-yellow-400" />;
    if (isSuccess) return <CheckCircle2 className="mr-2 h-4 w-4 text-green-400" />;
    if (errorCount > 0) return <AlertCircle className="mr-2 h-4 w-4 text-red-400" />;
    return <RefreshCw className="mr-2 h-4 w-4" />;
  };

  const getButtonClass = () => {
    if (isSuccess && isMismatch) return "w-full bg-yellow-700 hover:bg-yellow-800 text-white";
    if (isSuccess) return "w-full bg-green-700 hover:bg-green-800 text-white";
    if (errorCount > 0) return "w-full bg-red-600 hover:bg-red-700 text-white";
    return "w-full bg-red-600 hover:bg-red-700 text-white";
  };

  const handleClick = () => {
    if (!isButtonDisabled) {
      const now = new Date();
      setLastClickTime(now);
      setOperationStartTime(now);
      setShowExtendedTimeoutWarning(false);
      
      // Reset error count if this is a new operation (not a retry within 10 seconds)
      if (!lastClickTime || (now.getTime() - lastClickTime.getTime() > 10000)) {
        setErrorCount(0);
      } else {
        // If clicking again quickly, it might be a retry after error
        setErrorCount(prev => prev + 1);
      }
      
      onClick();
    }
  };

  return (
    <div className="w-full space-y-2">
      <Button
        onClick={handleClick}
        className={getButtonClass()}
        disabled={isButtonDisabled}
        size="lg"
      >
        {getIcon()}
        {getButtonText()}
        {(isDeleting || isImporting) && (
          <span className="ml-2 text-xs bg-black/20 px-2 py-1 rounded-full flex items-center">
            <Clock className="mr-1 h-3 w-3" />
            {elapsedTime}
          </span>
        )}
      </Button>
      
      {/* Data verification status */}
      {(expectedTotal !== undefined && actualTotal !== undefined) && (
        <div className={`text-xs ${isMismatch ? 'text-yellow-400' : 'text-green-400'} flex items-center`}>
          <Database className="mr-1 h-3 w-3" />
          Order counts: {actualTotal} of {expectedTotal} expected 
          {unfulfilled !== undefined && partialFulfilled !== undefined && (
            <span className="ml-1">
              ({unfulfilled} unfulfilled, {partialFulfilled} partial)
            </span>
          )}
          {isMismatch && <span className="font-bold ml-1">- MISMATCH DETECTED!</span>}
        </div>
      )}
      
      {errorCount > 0 && (
        <p className="text-xs text-red-400">
          Error detected. Check the debug info section below for details.
          {errorCount > 1 && " Multiple attempts failed."}
        </p>
      )}
      
      {timeoutActive && (
        <p className="text-xs text-amber-400">
          Operation in progress. Button will auto-enable in 5 minutes if the operation doesn't complete 
          {isMismatch && " and data verification passes"}.
        </p>
      )}
      
      {showExtendedTimeoutWarning && (isDeleting || isImporting) && (
        <p className="text-xs text-amber-400 font-semibold">
          This operation is taking longer than expected but is still running in the background. 
          Do not close this page or start another operation.
        </p>
      )}
      
      {isMismatch && (
        <p className="text-xs text-yellow-500 font-semibold">
          Data verification failed: Expected {expectedTotal} orders but found {actualTotal}. 
          The import may be incomplete or still processing in the background.
        </p>
      )}
      
      {isDeleting && (
        <p className="text-xs text-zinc-400">
          Deleting all orders via specialized RPC functions. This operation MUST delete order items first, then orders.
        </p>
      )}
      
      {isImporting && (
        <p className="text-xs text-zinc-400">
          Importing orders may take several minutes for large datasets. Import continues in the background even if this page is closed.
        </p>
      )}
    </div>
  );
};

export default RefreshButton;
