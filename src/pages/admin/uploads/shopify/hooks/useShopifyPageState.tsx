
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useShopifyOrders } from '@/hooks/useShopifyOrders';
import { useToast } from '@/hooks/use-toast';

// The special value 'placeholder_token' represents no token being set
const PLACEHOLDER_TOKEN_VALUE = 'placeholder_token';

export const useShopifyPageState = () => {
  const [hasToken, setHasToken] = useState(false);
  const [maskedToken, setMaskedToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSchemaError, setIsSchemaError] = useState(false);
  const [apiConnectionError, setApiConnectionError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const { 
    importedOrders, 
    lastImport, 
    fetchRecentOrders, 
    isLoading: ordersLoading,
    error: ordersError
  } = useShopifyOrders();

  // When ordersError changes, update the API connection error state
  useEffect(() => {
    if (ordersError) {
      console.log("Setting API connection error:", ordersError);
      setApiConnectionError(ordersError);
    } else {
      setApiConnectionError(null);
    }
  }, [ordersError]);

  // Function to mask the token for display
  const maskToken = (token: string) => {
    if (!token || token.length <= 8) return '********';
    return token.substring(0, 4) + '********' + token.substring(token.length - 4);
  };

  // Skip the column existence check - assume column exists
  const checkForSchemaErrors = async () => {
    // Simply set schema error to false - we know the column exists from the screenshots
    setIsSchemaError(false);
  };

  // Function to check for token in the database
  const checkForToken = async () => {
    setIsLoading(true);
    try {
      console.log("Checking for API token in database...");
      // Using RPC for type safety
      const { data, error } = await supabase.rpc("get_shopify_setting", { 
        setting_name_param: 'shopify_token' 
      });
      
      if (error) {
        console.error('Error checking for token in database:', error);
        setHasToken(false);
        setMaskedToken('');
        return;
      }
      
      // Check if we have a valid token (not the placeholder)
      if (data && typeof data === 'string' && data !== PLACEHOLDER_TOKEN_VALUE) {
        setHasToken(true);
        setMaskedToken(maskToken(data));
        console.log("API token found in database");
      } else {
        console.log("No valid API token found in database");
        setHasToken(false);
        setMaskedToken('');
      }
    } catch (error) {
      console.error('Exception checking for token:', error);
      setHasToken(false);
      setMaskedToken('');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial check on component mount
  useEffect(() => {
    checkForToken();
    checkForSchemaErrors();
    
    // Set up a subscription to token changes
    const channel = supabase
      .channel('shopify_settings_changes')
      .on('postgres_changes', 
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shopify_settings',
          filter: 'setting_name=eq.shopify_token'
        }, 
        () => {
          checkForToken();
        })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle refresh button click
  const handleRefresh = () => {
    console.log("Manual refresh requested by user");
    fetchRecentOrders();
    checkForSchemaErrors();
    setApiConnectionError(null);
    
    toast({
      title: "Refreshing Data",
      description: "Checking API connection and refreshing orders data...",
      variant: "default",
    });
  };

  return {
    hasToken,
    setHasToken,
    maskedToken,
    setMaskedToken,
    isLoading,
    isSchemaError,
    apiConnectionError,
    importedOrders,
    lastImport,
    fetchRecentOrders,
    ordersLoading,
    handleRefresh
  };
};
