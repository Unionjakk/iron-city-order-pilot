
import { supabase } from "./client.ts";

// Update last sync time
export async function updateLastSyncTime(debug: (message: string) => void) {
  const { error: updateError } = await supabase.rpc("upsert_shopify_setting", {
    setting_name_param: "last_sync_time",
    setting_value_param: new Date().toISOString()
  });

  if (updateError) {
    debug(`Error updating last sync time: ${updateError.message}`);
    return false;
  }
  
  return true;
}

// Get Shopify API endpoint from settings
export async function getShopifyApiEndpoint(debug: (message: string) => void) {
  const { data: endpointData, error: endpointError } = await supabase.rpc("get_shopify_setting", { 
    setting_name_param: "shopify_api_endpoint" 
  });
  
  if (endpointError) {
    debug(`Error retrieving API endpoint from database: ${endpointError.message}`);
    throw new Error("Failed to retrieve API endpoint configuration");
  }
  
  // Use the stored endpoint or fall back to the default if not configured
  return endpointData || "https://opus-harley-davidson.myshopify.com/admin/api/2023-07/orders.json";
}
