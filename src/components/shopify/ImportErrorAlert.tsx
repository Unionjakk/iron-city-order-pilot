
import React from 'react';

interface ImportErrorAlertProps {
  error: string;
}

const ImportErrorAlert: React.FC<ImportErrorAlertProps> = ({ error }) => {
  if (!error) return null;
  
  return (
    <div className="bg-red-900/20 border border-red-500/50 rounded-md p-4 mb-4">
      <h4 className="text-red-400 font-medium">Import Error</h4>
      <p className="text-zinc-300 text-sm mt-1">{error}</p>
    </div>
  );
};

export default ImportErrorAlert;
