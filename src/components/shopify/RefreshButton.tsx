
import { Button } from "@/components/ui/button";
import { RefreshCw, Trash2, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface RefreshButtonProps {
  isDeleting: boolean;
  isImporting: boolean;
  isSuccess: boolean;
  onClick: () => void;
}

const RefreshButton = ({ isDeleting, isImporting, isSuccess, onClick }: RefreshButtonProps) => {
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState<Date | null>(null);
  const [timeoutActive, setTimeoutActive] = useState(false);

  // Reset the disabled state after 2 minutes to prevent permanent disabling on error
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isDeleting || isImporting) {
      setIsButtonDisabled(true);
      // Auto-enable after 2 minutes to prevent being permanently stuck
      timeout = setTimeout(() => {
        setIsButtonDisabled(false);
        setTimeoutActive(false);
      }, 120000);
      setTimeoutActive(true);
    } else {
      // Small delay before re-enabling button after operation completes
      timeout = setTimeout(() => {
        setIsButtonDisabled(false);
        setTimeoutActive(false);
      }, 2000);
    }
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isDeleting, isImporting, isSuccess]);

  const getButtonText = () => {
    if (isDeleting) return "Deleting All Data...";
    if (isImporting) return "Importing ONLY Active Unfulfilled & Partial Orders...";
    if (isSuccess) return "Import Completed Successfully";
    if (errorCount > 0) return "Error Occurred - Click to Try Again";
    return "Delete All & Import ONLY Active Unfulfilled Orders";
  };

  const getIcon = () => {
    if (isDeleting) return <Trash2 className="mr-2 h-4 w-4 animate-spin" />;
    if (isImporting) return <RefreshCw className="mr-2 h-4 w-4 animate-spin" />;
    if (isSuccess) return <CheckCircle2 className="mr-2 h-4 w-4 text-green-400" />;
    if (errorCount > 0) return <AlertCircle className="mr-2 h-4 w-4 text-red-400" />;
    return <RefreshCw className="mr-2 h-4 w-4" />;
  };

  const getButtonClass = () => {
    if (isSuccess) return "w-full bg-green-700 hover:bg-green-800 text-white";
    if (errorCount > 0) return "w-full bg-red-600 hover:bg-red-700 text-white";
    return "w-full bg-red-600 hover:bg-red-700 text-white";
  };

  const handleClick = () => {
    if (!isButtonDisabled) {
      const now = new Date();
      setLastClickTime(now);
      
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
      </Button>
      
      {errorCount > 0 && (
        <p className="text-xs text-red-400">
          Error detected. Check the debug info section below for details.
          {errorCount > 1 && " Multiple attempts failed."}
        </p>
      )}
      
      {timeoutActive && (
        <p className="text-xs text-amber-400">
          Operation in progress. Button will auto-enable in 2 minutes if the operation doesn't complete.
        </p>
      )}
      
      {isDeleting && (
        <p className="text-xs text-zinc-400">
          Deleting all orders via specialized RPC functions. If this takes more than 30 seconds, check debug info.
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
