
import { Button } from "@/components/ui/button";
import { RefreshCw, Trash2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface RefreshButtonProps {
  isDeleting: boolean;
  isImporting: boolean;
  onClick: () => void;
}

const RefreshButton = ({ isDeleting, isImporting, onClick }: RefreshButtonProps) => {
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
      setIsButtonDisabled(false);
    }
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isDeleting, isImporting]);

  const getButtonText = () => {
    if (isDeleting) return "Deleting All Data...";
    if (isImporting) return "Importing All Orders...";
    return "Delete All & Re-Import Everything";
  };

  const getIcon = () => {
    if (isDeleting) return <Trash2 className="mr-2 h-4 w-4 animate-spin" />;
    if (isImporting) return <RefreshCw className="mr-2 h-4 w-4 animate-spin" />;
    return <RefreshCw className="mr-2 h-4 w-4" />;
  };

  const handleClick = () => {
    if (!isButtonDisabled) {
      onClick();
    }
  };

  return (
    <Button
      onClick={handleClick}
      className="w-full bg-red-600 hover:bg-red-700 text-white"
      disabled={isButtonDisabled}
      size="lg"
    >
      {getIcon()}
      {getButtonText()}
    </Button>
  );
};

export default RefreshButton;
