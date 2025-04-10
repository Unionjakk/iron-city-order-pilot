
import { useState, useEffect } from 'react';
import { Clock, Info, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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
  const { toast } = useToast();

  // The special value 'placeholder_token' represents no token being set
  const PLACEHOLDER_TOKEN_VALUE = 'placeholder_token';

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Calculate time passed since a date
  const getTimeSinceLastRun = (dateString: string | null) => {
    if (!dateString) return 'never run';
    
    const lastRunDate = new Date(dateString);
    if (isNaN(lastRunDate.getTime())) return 'invalid date';
    
    const now = new Date();
    const diffMs = now.getTime() - lastRunDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  // Check if there are any imported orders
  const checkForImportedOrders = async () => {
    try {
      // Count rows in the shopify_orders table
      const { count, error } = await supabase
        .from('shopify_orders')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error checking for imported orders:', error);
        return;
      }
      
      // If we have any orders, set hasImportedOrders to true
      setHasImportedOrders(count !== null && count > 0);
    } catch (error) {
      console.error('Exception checking for imported orders:', error);
    }
  };

  // Get last sync time from database
  const fetchLastSyncTime = async () => {
    try {
      const { data: syncTimeData, error: syncTimeError } = await supabase.rpc('get_shopify_setting', { 
        setting_name_param: 'last_sync_time' 
      });
      
      if (syncTimeError) {
        console.error('Error retrieving last sync time from database:', syncTimeError);
        return;
      }
      
      if (syncTimeData && typeof syncTimeData === 'string' && syncTimeData !== PLACEHOLDER_TOKEN_VALUE) {
        setLastSyncTime(syncTimeData);
      }
      
      // Get last cron run time
      const { data: cronRunData, error: cronRunError } = await supabase.rpc('get_shopify_setting', { 
        setting_name_param: 'last_cron_run' 
      });
      
      if (cronRunError) {
        console.error('Error retrieving last cron run time from database:', cronRunError);
        return;
      }
      
      if (cronRunData && typeof cronRunData === 'string') {
        setLastCronRun(cronRunData);
      }
      
      // Check if auto-import is enabled
      const { data: autoImportData, error: autoImportError } = await supabase.rpc('get_shopify_setting', { 
        setting_name_param: 'auto_import_enabled' 
      });
      
      if (autoImportError) {
        console.error('Error retrieving auto-import setting from database:', autoImportError);
        return;
      }
      
      // Set auto-import status - make sure to do a strict comparison with the string 'true'
      setAutoImportEnabled(autoImportData === 'true');
    } catch (error) {
      console.error('Exception retrieving settings:', error);
    }
  };

  // Handle refresh status button click
  const handleRefreshStatus = async () => {
    setIsRefreshingStatus(true);
    try {
      await fetchLastSyncTime();
      await checkForImportedOrders();
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

  // Get token from database
  const getTokenFromDatabase = async () => {
    try {
      // Using RPC for type safety
      const { data, error } = await supabase.rpc('get_shopify_setting', { 
        setting_name_param: 'shopify_token' 
      });
      
      if (error) {
        console.error('Error retrieving token from database:', error);
        return null;
      }
      
      // Check if we have a valid token (not the placeholder)
      if (data && typeof data === 'string' && data !== PLACEHOLDER_TOKEN_VALUE) {
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Exception retrieving token:', error);
      return null;
    }
  };

  // Handle manual import - simplified to just one proper import function
  const handleManualImport = async () => {
    setIsImporting(true);
    
    try {
      const token = await getTokenFromDatabase();
      
      if (!token) {
        toast({
          title: "Error",
          description: "No API token found in database. Please add your Shopify API token first.",
          variant: "destructive",
        });
        setIsImporting(false);
        return;
      }
      
      // Call the edge function to sync orders with the complete synchronization logic
      const { data, error } = await supabase.functions.invoke('shopify-sync', {
        body: { apiToken: token }
      });
      
      if (error) {
        console.error('Error importing orders:', error);
        throw new Error(error.message || 'Failed to sync with Shopify');
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to sync with Shopify');
      }
      
      // Fetch the updated orders to refresh the UI
      await fetchRecentOrders();
      
      // Refresh the last sync time
      await fetchLastSyncTime();
      await checkForImportedOrders();
      
      toast({
        title: "Import Completed",
        description: `Successfully imported ${data.imported} new orders and archived ${data.archived} fulfilled orders.`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error importing orders:', error);
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
    fetchLastSyncTime();
    checkForImportedOrders();
    
    // Set up timer to check status every minute
    const intervalId = setInterval(() => {
      fetchLastSyncTime();
      checkForImportedOrders();
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Determine if auto-import might be stalled
  const isAutoImportPotentiallyStalled = () => {
    if (!autoImportEnabled || !lastCronRun) return false;
    
    const lastRunDate = new Date(lastCronRun);
    if (isNaN(lastRunDate.getTime())) return false;
    
    const now = new Date();
    const diffMs = now.getTime() - lastRunDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    // If more than 30 minutes have passed since the last cron run, it might be stalled
    return diffMins > 30;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            hasImportedOrders ? (
              <div className="flex items-center text-emerald-400">
                <CheckCircle className="mr-2 h-4 w-4" />
                <span>
                  Auto-import enabled {lastCronRun ? `(last run: ${getTimeSinceLastRun(lastCronRun)})` : '(never run yet)'}
                </span>
              </div>
            ) : (
              <div className="flex items-center text-amber-400">
                <AlertTriangle className="mr-2 h-4 w-4" />
                <span>
                  Auto-import is enabled but no orders have been imported yet
                  {lastCronRun ? ` (last attempted: ${getTimeSinceLastRun(lastCronRun)})` : ''}
                </span>
              </div>
            )
          ) : (
            <div className="flex items-center text-amber-400">
              <AlertTriangle className="mr-2 h-4 w-4" />
              <span>Auto-import is not currently active - only manual imports are available</span>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button 
            onClick={handleRefreshStatus} 
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
            onClick={handleManualImport} 
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
      </div>
      
      {isAutoImportPotentiallyStalled() && (
        <Alert variant="warning" className="bg-amber-900/20 border-amber-500/50 mt-4">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle>Auto-import may be stalled</AlertTitle>
          <AlertDescription className="text-zinc-300">
            The auto-import hasn't run in over 30 minutes. This could indicate an issue with the cron job.
            Try refreshing the status or contacting support if this persists.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ImportControls;
