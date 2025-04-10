
import { supabase } from '@/integrations/supabase/client';

// The special value 'placeholder_token' represents no token being set
export const PLACEHOLDER_TOKEN_VALUE = 'placeholder_token';

// Get token from database
export const getTokenFromDatabase = async () => {
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

// Get last sync time from database
export const fetchShopifySettings = async () => {
  try {
    const [syncTimeResult, cronRunResult, autoImportResult] = await Promise.all([
      // Get last sync time
      supabase.rpc('get_shopify_setting', { setting_name_param: 'last_sync_time' }),
      // Get last cron run time
      supabase.rpc('get_shopify_setting', { setting_name_param: 'last_cron_run' }),
      // Check if auto-import is enabled
      supabase.rpc('get_shopify_setting', { setting_name_param: 'auto_import_enabled' })
    ]);

    const { data: syncTimeData, error: syncTimeError } = syncTimeResult;
    
    if (syncTimeError) {
      console.error('Error retrieving last sync time from database:', syncTimeError);
    }
    
    const { data: cronRunData, error: cronRunError } = cronRunResult;
    
    if (cronRunError) {
      console.error('Error retrieving last cron run time from database:', cronRunError);
    }
    
    const { data: autoImportData, error: autoImportError } = autoImportResult;
    
    if (autoImportError) {
      console.error('Error retrieving auto-import setting from database:', autoImportError);
    }

    return {
      lastSyncTime: (syncTimeData && typeof syncTimeData === 'string' && syncTimeData !== PLACEHOLDER_TOKEN_VALUE) 
        ? syncTimeData 
        : null,
      lastCronRun: (cronRunData && typeof cronRunData === 'string') 
        ? cronRunData 
        : null,
      autoImportEnabled: autoImportData === 'true'
    };
  } catch (error) {
    console.error('Exception retrieving settings:', error);
    return {
      lastSyncTime: null,
      lastCronRun: null,
      autoImportEnabled: false
    };
  }
};

// Check if there are any imported orders
export const checkForImportedOrders = async () => {
  try {
    // Count rows in the shopify_orders table
    const { count, error } = await supabase
      .from('shopify_orders')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error checking for imported orders:', error);
      return false;
    }
    
    // If we have any orders, return true
    return count !== null && count > 0;
  } catch (error) {
    console.error('Exception checking for imported orders:', error);
    return false;
  }
};

// Toggle auto-import setting
export const toggleAutoImport = async (newValue: boolean) => {
  try {
    // Update the setting in the database
    const { error } = await supabase.rpc('upsert_shopify_setting', {
      setting_name_param: 'auto_import_enabled',
      setting_value_param: newValue ? 'true' : 'false'
    });
    
    if (error) {
      console.error('Error updating auto-import setting:', error);
      throw new Error(`Failed to update auto-import setting: ${error.message}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error toggling auto-import:', error);
    throw error;
  }
};

// Execute manual import
export const executeManualImport = async () => {
  try {
    const token = await getTokenFromDatabase();
    
    if (!token) {
      throw new Error("No API token found in database. Please add your Shopify API token first.");
    }
    
    // Call the edge function to sync orders with the complete synchronization logic
    // The edge function now handles pagination to get all orders
    const response = await supabase.functions.invoke('shopify-sync', {
      body: { apiToken: token }
    });

    if (response.error) {
      console.error('Error invoking shopify-sync function:', response.error);
      throw new Error(`Failed to connect to Shopify API: ${response.error.message || 'Unknown error'}`);
    }
    
    const data = response.data;
    
    if (!data || !data.success) {
      const errorMsg = data?.error || 'Unknown error occurred during Shopify sync';
      console.error('Shopify sync failed:', errorMsg);
      throw new Error(`Shopify sync failed: ${errorMsg}`);
    }
    
    return {
      imported: data.imported || 0,
      archived: data.archived || 0,
      cleaned: data.cleaned || 0
    };
  } catch (error) {
    console.error('Error importing orders:', error);
    throw error;
  }
};
