
import { AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { getNextRunTime, isAutoImportPotentiallyStalled } from './utils/dateUtils';

interface ImportAlertsProps {
  autoImportEnabled: boolean;
  lastCronRun: string | null;
}

const ImportAlerts = ({ autoImportEnabled, lastCronRun }: ImportAlertsProps) => {
  const showStallWarning = isAutoImportPotentiallyStalled(autoImportEnabled, lastCronRun);
  
  return (
    <>
      {showStallWarning && (
        <Alert variant="warning" className="bg-amber-900/20 border-amber-500/50 mt-4">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle>Auto-import may be stalled</AlertTitle>
          <AlertDescription className="text-zinc-300">
            The auto-import hasn't run in over 30 minutes. This could indicate an issue with the cron job.
            Try refreshing the status or checking the database logs if this persists.
          </AlertDescription>
        </Alert>
      )}
      
      <Alert className="bg-zinc-800/50 border-zinc-700/50">
        <Info className="h-4 w-4 text-zinc-400" />
        <AlertDescription className="text-zinc-300">
          <p>Auto-import runs every 15 minutes when enabled. You can manually trigger an import anytime.</p>
          {lastCronRun && (
            <p className="mt-1 text-sm text-zinc-400">
              Next scheduled run: approximately {getNextRunTime(lastCronRun)}
            </p>
          )}
        </AlertDescription>
      </Alert>
    </>
  );
};

export default ImportAlerts;
