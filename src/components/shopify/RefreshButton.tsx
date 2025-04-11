
import { Button } from "@/components/ui/button";
import { RefreshCw, Trash2, AlertCircle } from "lucide-react";

interface RefreshButtonProps {
  isDeleting: boolean;
  isImporting: boolean;
  onClick: () => void;
}

const RefreshButton = ({ isDeleting, isImporting, onClick }: RefreshButtonProps) => {
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

  return (
    <Button
      onClick={onClick}
      className="w-full bg-red-600 hover:bg-red-700 text-white"
      disabled={isDeleting || isImporting}
      size="lg"
    >
      {getIcon()}
      {getButtonText()}
    </Button>
  );
};

export default RefreshButton;
