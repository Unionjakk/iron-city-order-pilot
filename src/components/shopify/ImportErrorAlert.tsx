
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ImportErrorAlertProps {
  error: string;
  onDismiss?: () => void;
}

const ImportErrorAlert: React.FC<ImportErrorAlertProps> = ({ 
  error, 
  onDismiss
}) => {
  if (!error) return null;
  
  return (
    <Alert className="bg-red-900/20 border border-red-500/50 rounded-md p-4 mb-4">
      <AlertCircle className="h-5 w-5 text-red-500" />
      <div className="flex flex-col w-full">
        <div className="flex justify-between items-start">
          <AlertTitle className="text-red-400 font-medium">Import Error</AlertTitle>
          {onDismiss && (
            <Button 
              onClick={onDismiss}
              variant="ghost"
              size="sm"
              className="h-6 text-zinc-400 hover:text-zinc-200"
            >
              ×
            </Button>
          )}
        </div>
        <AlertDescription className="text-zinc-300 text-sm mt-1">{error}</AlertDescription>
      </div>
    </Alert>
  );
};

export default ImportErrorAlert;
