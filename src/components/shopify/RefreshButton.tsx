
import { Button } from "@/components/ui/button";
import { RefreshCw, Trash2, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";

interface RefreshButtonProps {
  isDeleting: boolean;
  isImporting: boolean;
  isSuccess: boolean;
  onClick: () => void;
}

const RefreshButton = ({ isDeleting, isImporting, isSuccess, onClick }: RefreshButtonProps) => {
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  // Reset the disabled state after 2 minutes to prevent permanent disabling on error
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isDeleting || isImporting) {
      setIsButtonDisabled(true);
      // Auto-enable after 2 minutes to prevent being permanently stuck
      timeout = setTimeout(() => {
        setIsButtonDisabled(false);
      }, 120000);
    } else {
      // Small delay before re-enabling button after operation completes
      timeout = setTimeout(() => {
        setIsButtonDisabled(false);
      }, 2000);
    }
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isDeleting, isImporting, isSuccess]);

  const getButtonText = () => {
    if (isDeleting) return "Deleting All Data...";
    if (isImporting) return "Importing Active Unfulfilled & Partial Orders...";
    if (isSuccess) return "Import Completed Successfully";
    return "Delete All & Import Active Unfulfilled Orders";
  };

  const getIcon = () => {
    if (isDeleting) return <Trash2 className="mr-2 h-4 w-4 animate-spin" />;
    if (isImporting) return <RefreshCw className="mr-2 h-4 w-4 animate-spin" />;
    if (isSuccess) return <CheckCircle2 className="mr-2 h-4 w-4 text-green-400" />;
    return <RefreshCw className="mr-2 h-4 w-4" />;
  };

  const getButtonClass = () => {
    if (isSuccess) return "w-full bg-green-700 hover:bg-green-800 text-white";
    return "w-full bg-red-600 hover:bg-red-700 text-white";
  };

  const handleClick = () => {
    if (!isButtonDisabled) {
      onClick();
    }
  };

  return (
    <Button
      onClick={handleClick}
      className={getButtonClass()}
      disabled={isButtonDisabled}
      size="lg"
    >
      {getIcon()}
      {getButtonText()}
    </Button>
  );
};

export default RefreshButton;
