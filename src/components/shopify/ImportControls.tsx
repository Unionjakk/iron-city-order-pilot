
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import ImportStatus from './ImportStatus';
import ImportActions from './ImportActions';
import ImportAlerts from './ImportAlerts';
import { 
  fetchShopifySettings, 
  checkForImportedOrders,
  toggleAutoImport,
  executeManualImport
} from './services/importService';

interface ImportControlsProps {
  lastImport: string | null;
  fetchRecentOrders: () => Promise<void>;
}

// IMPORTANT: This component interacts with a PRODUCTION Shopify API
// Any changes must maintain compatibility with the live system
const ImportControls = ({ lastImport, fetchRecentOrders }: ImportControlsProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [lastCronRun, setLastCronRun] = useState<string | null>(null);
  const [autoImportEnabled, setAutoImportEnabled] = useState(false);
  const [hasImportedOrders, setHasImportedOrders] = useState(false);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [isSwitchingAutoImport, setIsSwitchingAutoImport] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load settings and check for orders
  const loadSettingsAndOrders = async () => {
    try {
      const { lastSyncTime, lastCronRun, autoImportEnabled } = await fetchShopifySettings();
      setLastSyncTime(lastSyncTime);
      setLastCronRun(lastCronRun);
      setAutoImportEnabled(autoImportEnabled);
      
      const hasOrders = await checkForImportedOrders();
      setHasImportedOrders(hasOrders);
    } catch (error) {
      console.error('Error loading settings and orders:', error);
    }
  };

  // Handle refresh status button click
  const handleRefreshStatus = async () => {
    setIsRefreshingStatus(true);
    setImportError(null);
    try {
      await loadSettingsAndOrders();
      toast({
        title: "Status Refreshed",
        description: "Auto-import status has been refreshed.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error refreshing status:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh auto-import status.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshingStatus(false);
    }
  };

  // Toggle auto-import setting
  const handleToggleAutoImport = async () => {
    setIsSwitchingAutoImport(true);
    setImportError(null);
    try {
      const newValue = !autoImportEnabled;
      await toggleAutoImport(newValue);
      setAutoImportEnabled(newValue);
      
      toast({
        title: newValue ? "Auto-import Enabled" : "Auto-import Disabled",
        description: newValue 
          ? "Orders will be automatically imported every 15 minutes." 
          : "Automatic importing has been disabled. You can still import manually.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error toggling auto-import:', error);
      toast({
        title: "Setting Change Failed",
        description: "Failed to update auto-import setting.",
        variant: "destructive",
      });
    } finally {
      setIsSwitchingAutoImport(false);
    }
  };

  // Clear error state
  const handleClearError = () => {
    setImportError(null);
  };

  // Handle manual import
  const handleManualImport = async () => {
    setIsImporting(true);
    setImportError(null);
    
    try {
      const result = await executeManualImport();
      
      // Fetch the updated orders to refresh the UI
      await fetchRecentOrders();
      
      // Refresh the last sync time
      await loadSettingsAndOrders();
      
      toast({
        title: "Import Completed",
        description: `Successfully imported ${result.imported} new orders, archived ${result.archived} fulfilled orders, and fixed ${result.fixed} incorrectly archived orders.`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error importing orders:', error);
      setImportError(error.message || "Unknown error occurred");
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Fetch last sync time and check for imported orders on component mount
  useEffect(() => {
    loadSettingsAndOrders();
    
    // Set up timer to check status every minute
    const intervalId = setInterval(() => {
      loadSettingsAndOrders();
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="space-y-4">
      {importError && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-md p-4 mb-4">
          <h4 className="text-red-400 font-medium">Import Error</h4>
          <p className="text-zinc-300 text-sm mt-1">{importError}</p>
        </div>
      )}
      
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
