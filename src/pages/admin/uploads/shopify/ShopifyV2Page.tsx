
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ApiConfigCard from './components/v2/ApiConfigCard';
import SingleOrderImportCard from './components/v2/SingleOrderImportCard';
import AllOpenOrdersImportCard from './components/v2/AllOpenOrdersImportCard';
import AllOpenOrdersImportV2Card from './components/v2/AllOpenOrdersImportV2Card';
import BatchLocationUpdateCard from './components/v2/BatchLocationUpdateCard';
import BatchLocationUpdateV2 from '@/components/shopify/BatchLocationUpdateV2';
import ApiIntegrationDetailsCard from './components/v2/ApiIntegrationDetailsCard';
import DeleteOrdersCard from './components/v2/DeleteOrdersCard';
import PageHeader from './components/v2/PageHeader';
import ProductionWarningAlert from './components/v2/ProductionWarningAlert';

const ShopifyV2Page = () => {
  const [hasToken, setHasToken] = useState(false);
  const [maskedToken, setMaskedToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshInProgress, setRefreshInProgress] = useState(false);
  const { toast } = useToast();

  // Fetch token on component mount
  useEffect(() => {
    const fetchToken = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_shopify_setting', { 
          setting_name_param: 'shopify_token' 
        });
        
        if (error) {
          console.error('Error fetching token:', error);
          return;
        }
        
        if (data && typeof data === 'string' && data !== 'placeholder_token') {
          setHasToken(true);
          // Mask the token for display
          const maskedValue = data.substring(0, 4) + '********' + data.substring(data.length - 4);
          setMaskedToken(maskedValue);
        }
      } catch (error) {
        console.error('Exception fetching token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchToken();
  }, []);

  // Function to refresh order data after operations
  const refreshData = async () => {
    try {
      setRefreshInProgress(true);
      // Add any additional refresh logic here if needed
      
      toast({
        title: "Refresh Complete",
        description: "Order data has been refreshed",
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Refresh Failed",
        description: "An error occurred while refreshing data",
        variant: "destructive",
      });
    } finally {
      setRefreshInProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader />
      
      <ProductionWarningAlert />
      
      {/* API Configuration Card */}
      <ApiConfigCard 
        isLoading={isLoading} 
        hasToken={hasToken} 
        maskedToken={maskedToken} 
        setHasToken={setHasToken} 
        setMaskedToken={setMaskedToken} 
      />
      
      {/* Only show these components when token is available */}
      {hasToken && (
        <>
          {/* Single Order Import */}
          <SingleOrderImportCard onImportComplete={refreshData} />
          
          {/* Delete All Orders */}
          <DeleteOrdersCard />
          
          {/* All Open Orders Import */}
          <AllOpenOrdersImportCard onImportComplete={refreshData} />
          
          {/* New All Open Orders Import V2 */}
          <AllOpenOrdersImportV2Card onImportComplete={refreshData} />
          
          {/* Batch Location Update V2 */}
          <BatchLocationUpdateV2 
            disabled={refreshInProgress}
            onUpdateComplete={refreshData}
          />
          
          {/* Batch Location Update */}
          <BatchLocationUpdateCard 
            disabled={refreshInProgress}
            onUpdateComplete={refreshData}
          />
          
          {/* API Integration Details */}
          <ApiIntegrationDetailsCard />
        </>
      )}
    </div>
  );
};

export default ShopifyV2Page;
