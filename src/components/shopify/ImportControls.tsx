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
      console.log('Auto import status:', autoImportData, autoImportData === 'true');
    } catch (error) {
      console.error('Exception retrieving settings:', error);
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

  // Handle manual import
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
      
      // Call the edge function to sync orders - note that JWT verification is now disabled
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

  return (
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
                Auto-import enabled {lastCronRun ? `(last run: ${formatDate(lastCronRun)})` : '(never run yet)'}
              </span>
            </div>
          ) : (
            <div className="flex items-center text-amber-400">
              <AlertTriangle className="mr-2 h-4 w-4" />
              <span>
                Auto-import is enabled but no orders have been imported yet
                {lastCronRun ? ` (last attempted: ${formatDate(lastCronRun)})` : ''}
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
  );
};

export default ImportControls;
