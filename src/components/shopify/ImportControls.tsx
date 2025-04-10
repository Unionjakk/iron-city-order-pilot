
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
      console.log("Loading Shopify integration settings...");
      const { lastSyncTime, lastCronRun, autoImportEnabled, apiEndpoint } = await fetchShopifySettings();
      setLastSyncTime(lastSyncTime);
      setLastCronRun(lastCronRun);
      setAutoImportEnabled(autoImportEnabled);
      console.log(`Settings loaded: lastSync=${lastSyncTime}, lastCron=${lastCronRun}, autoImport=${autoImportEnabled}, endpoint=${apiEndpoint}`);
      
      const hasOrders = await checkForImportedOrders();
      setHasImportedOrders(hasOrders);
      console.log(`Has imported orders: ${hasOrders}`);
    } catch (error: any) {
      console.error('Error loading settings and orders:', error);
      setImportError(`Error loading configuration: ${error.message}`);
    }
  };

  // Handle refresh status button click
  const handleRefreshStatus = async () => {
    setIsRefreshingStatus(true);
    setImportError(null);
    try {
      console.log("Manual refresh of Shopify settings requested");
      await loadSettingsAndOrders();
      toast({
        title: "Status Refreshed",
        description: "Auto-import status has been refreshed.",
        variant: "default",
      });
    } catch (error: any) {
      console.error('Error refreshing status:', error);
      setImportError(`Failed to refresh status: ${error.message}`);
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
      console.log(`Toggling auto-import to: ${newValue}`);
      await toggleAutoImport(newValue);
      setAutoImportEnabled(newValue);
      
      toast({
        title: newValue ? "Auto-import Enabled" : "Auto-import Disabled",
        description: newValue 
          ? "Orders will be automatically imported every 15 minutes." 
          : "Automatic importing has been disabled. You can still import manually.",
        variant: "default",
      });
    } catch (error: any) {
      console.error('Error toggling auto-import:', error);
      setImportError(`Failed to update auto-import setting: ${error.message}`);
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
      console.log("Starting manual Shopify order import");
      toast({
        title: "Import Started",
        description: "Importing all unfulfilled orders. This may take a few minutes for large order sets...",
        variant: "default",
      });
      
      const result = await executeManualImport();
      console.log("Import completed successfully:", result);
      
      // Fetch the updated orders to refresh the UI
      await fetchRecentOrders();
      
      // Refresh the last sync time
      await loadSettingsAndOrders();
      
      toast({
        title: "Import Completed",
        description: `Successfully imported ${result.imported} new orders, archived ${result.archived} fulfilled orders, and cleaned ${result.cleaned} incorrectly archived orders.`,
        variant: "default",
      });
    } catch (error: any) {
      console.error('Error importing orders:', error);
      const errorMessage = error.message || "Unknown error occurred";
      console.log("Setting import error:", errorMessage);
      setImportError(errorMessage);
      toast({
        title: "Import Failed",
        description: "Failed to import orders. See error details for more information.",
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
