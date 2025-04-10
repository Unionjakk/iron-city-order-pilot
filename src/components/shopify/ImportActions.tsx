
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ImportActionsProps {
  isRefreshingStatus: boolean;
  isSwitchingAutoImport: boolean;
  isImporting: boolean;
  autoImportEnabled: boolean;
  onRefreshStatus: () => Promise<void>;
  onToggleAutoImport: () => Promise<void>;
  onManualImport: () => Promise<void>;
}

const ImportActions = ({
  isRefreshingStatus,
  isSwitchingAutoImport,
  isImporting,
  autoImportEnabled,
  onRefreshStatus,
  onToggleAutoImport,
  onManualImport
}: ImportActionsProps) => {
  return (
    <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
      <div className="flex items-center space-x-2">
        <Switch
          id="auto-import"
          checked={autoImportEnabled}
          onCheckedChange={onToggleAutoImport}
          disabled={isSwitchingAutoImport}
        />
        <Label htmlFor="auto-import" className="text-sm">
          {isSwitchingAutoImport ? 'Updating...' : 'Auto Import'}
        </Label>
      </div>
      
      <Button 
        onClick={onRefreshStatus} 
        variant="outline"
        size="sm"
        disabled={isRefreshingStatus}
        className="whitespace-nowrap"
      >
        {isRefreshingStatus ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Refreshing...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Status
          </>
        )}
      </Button>
      
      <Button 
        onClick={onManualImport} 
        className="bg-orange-500 hover:bg-orange-600"
        disabled={isImporting}
      >
        {isImporting ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Importing...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Import Orders Now
          </>
        )}
      </Button>
    </div>
  );
};

export default ImportActions;
