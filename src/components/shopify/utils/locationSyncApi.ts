
import { supabase } from '@/integrations/supabase/client';

export const getShopifyToken = async () => {
  const { data: token, error: tokenError } = await supabase.rpc('get_shopify_setting', { 
    setting_name_param: 'shopify_token' 
  });
  
  if (tokenError) {
    throw new Error(`Failed to get API token: ${tokenError.message}`);
  }
  
  if (!token) {
    throw new Error("No API token found in settings");
  }
  
  return token;
};

export const getEstimatedTotal = async () => {
  const { count } = await supabase
    .from('shopify_order_items')
    .select('*', { count: 'exact', head: true })
    .is('location_id', null);
  
  return count;
};

export const invokeBatchLocationSync = async (token: string) => {
  return await supabase.functions.invoke('shopify-locations-sync-v3', {
    body: { 
      apiToken: token,
      continuationToken: null
    }
  });
};
