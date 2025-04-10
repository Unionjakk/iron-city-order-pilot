
import React from 'react';
import ImportStatus from './ImportStatus';
import ImportActions from './ImportActions';
import ImportAlerts from './ImportAlerts';
import ImportErrorAlert from './ImportErrorAlert';
import { useImportControls } from './services/importHooks';

interface ImportControlsProps {
  lastImport: string | null;
  fetchRecentOrders: () => Promise<void>;
}

// IMPORTANT: This component interacts with a PRODUCTION Shopify API
// Any changes must maintain compatibility with the live system
const ImportControls: React.FC<ImportControlsProps> = ({ lastImport, fetchRecentOrders }) => {
  const {
    isImporting,
    lastSyncTime,
    lastCronRun,
    autoImportEnabled,
    isRefreshingStatus,
    isSwitchingAutoImport,
    importError,
    handleRefreshStatus,
    handleToggleAutoImport,
    handleClearError,
    handleManualImport
  } = useImportControls(lastImport, fetchRecentOrders);

  return (
    <div className="space-y-4">
      {importError && <ImportErrorAlert error={importError} />}
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <ImportStatus
          lastSyncTime={lastSyncTime}
          lastImport={lastImport}
          lastCronRun={lastCronRun}
          autoImportEnabled={autoImportEnabled}
        />
        
        <ImportActions
          isRefreshingStatus={isRefreshingStatus}
          isSwitchingAutoImport={isSwitchingAutoImport}
          isImporting={isImporting}
          autoImportEnabled={autoImportEnabled}
          hasImportError={!!importError}
          onRefreshStatus={handleRefreshStatus}
          onToggleAutoImport={handleToggleAutoImport}
          onManualImport={handleManualImport}
          onClearError={handleClearError}
        />
      </div>
      
      <ImportAlerts
        autoImportEnabled={autoImportEnabled}
        lastCronRun={lastCronRun}
      />
    </div>
  );
};

export default ImportControls;
