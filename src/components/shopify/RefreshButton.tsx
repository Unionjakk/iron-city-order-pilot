
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trash2 } from 'lucide-react';

interface RefreshButtonProps {
  isDeleting: boolean;
  isImporting: boolean;
  onClick: () => void;
}

const RefreshButton: React.FC<RefreshButtonProps> = ({ isDeleting, isImporting, onClick }) => {
  return (
    <Button 
      onClick={onClick} 
      className="w-full bg-red-600 hover:bg-red-700"
      disabled={isDeleting || isImporting}
    >
      {isDeleting ? (
        <>
          <Trash2 className="mr-2 h-4 w-4 animate-pulse" />
          Deleting All Data...
        </>
      ) : isImporting ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Importing All Orders...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Delete All & Re-Import Everything
        </>
      )}
    </Button>
  );
};

export default RefreshButton;
