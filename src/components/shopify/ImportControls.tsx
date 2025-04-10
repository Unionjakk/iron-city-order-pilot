
import { useState } from 'react';
import { Clock, Info, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ImportControlsProps {
  lastImport: string | null;
  fetchRecentOrders: () => Promise<void>;
}

const ImportControls = ({ lastImport, fetchRecentOrders }: ImportControlsProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

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
      const { data, error } = await supabase
        .from('shopify_settings')
        .select('setting_value')
        .eq('setting_name', 'shopify_token')
        .single();
      
      if (error || !data || data.setting_value === 'placeholder_token') {
        console.error('Error retrieving token from database:', error);
        return null;
      }
      
      return data.setting_value;
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
