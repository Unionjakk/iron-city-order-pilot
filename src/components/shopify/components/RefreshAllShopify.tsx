
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Importing the required components that will be executed in sequence
import AllOpenOrdersImportV2Card from '@/pages/admin/uploads/shopify/components/v2/AllOpenOrdersImportV2Card';
import BatchLocationUpdateV3 from '@/components/shopify/BatchLocationUpdateV3';

interface RefreshAllShopifyProps {
  onRefreshComplete?: () => void;
}

const RefreshAllShopify = ({ onRefreshComplete }: RefreshAllShopifyProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [refreshStatus, setRefreshStatus] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Helper function to create a delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Get last update info from settings
  const fetchLastUpdated = async () => {
    try {
      const { data, error } = await supabase.rpc("get_shopify_setting", {
        setting_name_param: "shopify_manual_updated_finished"
      });
      
      if (!error && data === "True") {
        // Get timestamp of when it was updated
        const { data: timestamp, error: timestampError } = await supabase
          .from('shopify_settings')
          .select('updated_at')
          .eq('setting_name', 'shopify_manual_updated_finished')
          .single();
          
        if (!timestampError && timestamp) {
          setLastUpdated(new Date(timestamp.updated_at).toLocaleString());
        }
      }
    } catch (error) {
      console.error("Error fetching last updated:", error);
    }
  };
  
  // Run on component mount
  useState(() => {
    fetchLastUpdated();
  });
  
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      setCurrentStep(1);
      
      // Step 1: Delete all orders
      setRefreshStatus("Deleting all orders...");
      try {
        const { data: apiToken } = await supabase.rpc("get_shopify_setting", {
          setting_name_param: "shopify_token"
        });
        
        // Call the database cleanup function
        await supabase.functions.invoke('shopify-database-cleanup', {
          body: { apiToken }
        });
      } catch (error) {
        console.error("Error in step 1:", error);
        // Continue regardless of errors
      }
      
      // Wait 10 seconds
      await delay(10000);
      setCurrentStep(2);
      
      // Step 2: Import all open orders
      setRefreshStatus("Importing all open orders...");
      try {
        // We don't need to instantiate components with 'new'
        // Instead, we'll directly call the edge function
        const { data: apiToken } = await supabase.rpc("get_shopify_setting", {
          setting_name_param: "shopify_token"
        });
        
        await supabase.functions.invoke('shopify-all-open-unfulfilled-partial_v2', {
          body: { apiToken }
        });
      } catch (error) {
        console.error("Error in step 2:", error);
        // Continue regardless of errors
      }
      
      // Wait 10 seconds
      await delay(10000);
      setCurrentStep(3);
      
      // Step 3: Update batch locations
      setRefreshStatus("Updating batch locations...");
      try {
        const { data: apiToken } = await supabase.rpc("get_shopify_setting", {
          setting_name_param: "shopify_token"
        });
        
        // Call the locations sync edge function directly
        await supabase.functions.invoke('shopify-locations-sync-v3', {
          body: { apiToken }
        });
      } catch (error) {
        console.error("Error in step 3:", error);
        // Continue regardless of errors
      }
      
      // Step 4: Update setting to indicate completion
      setCurrentStep(4);
      setRefreshStatus("Updating settings...");
      
      try {
        await supabase.rpc("upsert_shopify_setting", {
          setting_name_param: "shopify_manual_updated_finished",
          setting_value_param: "True"
        });
        
        // Update the last updated timestamp
        await fetchLastUpdated();
      } catch (error) {
        console.error("Error updating settings:", error);
      }
      
      // Complete
      setCurrentStep(5);
      setRefreshStatus("Completed");
      
      toast({
        title: "Refresh Complete",
        description: "Shopify data has been refreshed.",
      });
      
      if (onRefreshComplete) {
        onRefreshComplete();
      }
    } catch (error) {
      console.error("Error during refresh:", error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <div className="flex flex-col items-end space-y-2">
      <Button 
        onClick={handleRefresh} 
        disabled={isRefreshing}
        className="bg-orange-500 hover:bg-orange-600 text-white"
        size="sm"
      >
        {isRefreshing ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Step {currentStep}/5...
          </>
        ) : (
          "Refresh All Shopify"
        )}
      </Button>
      
      {refreshStatus && (
        <div className="text-xs text-orange-400">
          Status: {refreshStatus}
        </div>
      )}
      
      {lastUpdated && !isRefreshing && (
        <div className="text-xs text-zinc-400">
          Last updated: {lastUpdated}
        </div>
      )}
    </div>
  );
};

export default RefreshAllShopify;
