import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RefreshAllShopifyProps {
  onRefreshComplete?: () => void;
}

interface LocationUpdateResponse {
  success: boolean;
  updated: number;
  totalProcessed: number;
  processingComplete: boolean;
  continuationToken?: string;
  rateLimitRemaining?: number;
  timeElapsed?: number;
}

const RefreshAllShopify = ({ onRefreshComplete }: RefreshAllShopifyProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [refreshStatus, setRefreshStatus] = useState<string | null>(null);
  const [locationCheckComplete, setLocationCheckComplete] = useState<boolean>(false);
  const { toast } = useToast();
  
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  const fetchLastUpdated = async () => {
    try {
      const { data, error } = await supabase.rpc("get_shopify_setting", {
        setting_name_param: "shopify_manual_updated_finished"
      });
      
      if (!error && data === "True") {
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
  
  useEffect(() => {
    fetchLastUpdated();
  }, []);
  
  const checkLocationCompletion = async (): Promise<boolean> => {
    try {
      const { count: nullLocations, error: locationsError } = await supabase
        .from('shopify_order_items')
        .select('*', { count: 'exact', head: true })
        .is('location_name', null);
      
      if (locationsError) {
        console.error("Error checking locations:", locationsError);
        return false;
      }
      
      return nullLocations === 0;
    } catch (error) {
      console.error("Error in location check:", error);
      return false;
    }
  };
  
  const runLocationUpdate = async (): Promise<void> => {
    try {
      const { data: apiToken } = await supabase.rpc("get_shopify_setting", {
        setting_name_param: "shopify_token"
      });
      
      let continuationToken: string | null = null;
      let totalUpdated = 0;
      let totalProcessed = 0;
      let isComplete = false;
      
      while (!isComplete) {
        setRefreshStatus(`Updating batch locations... (${totalProcessed} processed)`);
        
        const response = await supabase.functions.invoke('shopify-locations-sync-v3', {
          body: { 
            apiToken,
            continuationToken
          }
        });
        
        const data = response.data as LocationUpdateResponse;
        
        if (!data) {
          console.error("No data received from location sync function");
          throw new Error("No data received from location sync function");
        }
        
        totalUpdated += data.updated;
        totalProcessed += data.totalProcessed;
        
        if (data.processingComplete) {
          console.log(`Location update complete. Updated ${totalUpdated} of ${totalProcessed} items`);
          isComplete = true;
          setLocationCheckComplete(true);
          break;
        } else if (data.continuationToken) {
          console.log("Continuing with next batch...");
          continuationToken = data.continuationToken;
          await delay(1500); // Respect rate limiting
        } else {
          console.error("No continuation token received but processing not complete");
          throw new Error("Location sync error: Missing continuation token");
        }
      }
    } catch (error) {
      console.error("Error in location update:", error);
      throw error;
    }
  };
  
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      setCurrentStep(1);
      setLocationCheckComplete(false);
      
      setRefreshStatus("Deleting all orders...");
      try {
        const { data: apiToken } = await supabase.rpc("get_shopify_setting", {
          setting_name_param: "shopify_token"
        });
        
        await supabase.functions.invoke('shopify-database-cleanup', {
          body: { apiToken }
        });
      } catch (error) {
        console.error("Error in step 1:", error);
      }
      
      await delay(10000);
      setCurrentStep(2);
      
      setRefreshStatus("Importing all open orders...");
      try {
        const { data: apiToken } = await supabase.rpc("get_shopify_setting", {
          setting_name_param: "shopify_token"
        });
        
        await supabase.functions.invoke('shopify-all-open-unfulfilled-partial_v2', {
          body: { apiToken }
        });
      } catch (error) {
        console.error("Error in step 2:", error);
      }
      
      await delay(10000);
      setCurrentStep(3);
      
      setRefreshStatus("Updating batch locations...");
      
      await runLocationUpdate();
      
      setCurrentStep(4);
      setRefreshStatus("Updating settings...");
      
      try {
        await supabase.rpc("upsert_shopify_setting", {
          setting_name_param: "shopify_manual_updated_finished",
          setting_value_param: "True"
        });
        
        await fetchLastUpdated();
      } catch (error) {
        console.error("Error updating settings:", error);
      }
      
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
      toast({
        title: "Error",
        description: "An error occurred during refresh.",
      });
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
