
import { useState } from 'react';
import { Clock, Info, RefreshCw, AlertTriangle } from 'lucide-react';
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
  const { toast } = useToast();

  // The special value 'placeholder_token' represents no token being set
  const PLACEHOLDER_TOKEN_VALUE = 'placeholder_token';

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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
      
      // Call the edge function to sync orders
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

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-2">
        <div className="flex items-center text-zinc-400">
          <Clock className="mr-2 h-4 w-4" />
          <span>
            {lastImport 
              ? `Last import: ${formatDate(lastImport)}` 
              : 'No imports have been run yet'}
          </span>
        </div>
        
        <div className="flex items-center text-zinc-400">
          <Info className="mr-2 h-4 w-4" />
          <span>Auto-import scheduled every 30 minutes</span>
        </div>
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
