
import { Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatDate, getTimeSinceLastRun } from './utils/dateUtils';

interface ImportStatusProps {
  lastSyncTime: string | null;
  lastImport: string | null;
  lastCronRun: string | null;
  autoImportEnabled: boolean;
}

const ImportStatus = ({ 
  lastSyncTime, 
  lastImport, 
  lastCronRun, 
  autoImportEnabled 
}: ImportStatusProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center text-zinc-400">
        <Clock className="mr-2 h-4 w-4" />
        <span>
          {lastSyncTime 
            ? `Last import: ${formatDate(lastSyncTime)}` 
            : lastImport 
              ? `Last import: ${formatDate(lastImport)}` 
              : 'No imports have been run yet'}
        </span>
      </div>
      
      {autoImportEnabled ? (
        <div className="flex items-center text-emerald-400">
          <CheckCircle className="mr-2 h-4 w-4" />
          <span>
            Auto-import enabled - runs every 15 minutes {lastCronRun ? `(last run: ${getTimeSinceLastRun(lastCronRun)})` : '(never run yet)'}
          </span>
        </div>
      ) : (
        <div className="flex items-center text-amber-400">
          <AlertTriangle className="mr-2 h-4 w-4" />
          <span>Auto-import is disabled - only manual imports are available</span>
        </div>
      )}
    </div>
  );
};

export default ImportStatus;
