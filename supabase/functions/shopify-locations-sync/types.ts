
// CORS headers for browser requests
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// API request body for Shopify sync
export interface RequestBody {
  apiToken?: string;
}

// API response body for Shopify sync
export interface SyncResponse {
  success: boolean;
  error: string | null;
  updated: number;
  debugMessages: string[];
}

// Simplified Shopify API order interface
export interface ShopifyOrder {
  id: string;
  name: string;
  order_number?: string;
  created_at: string;
  line_items?: ShopifyLineItem[];
  fulfillments?: any[];
}

// Shopify API line item interface with location data
export interface ShopifyLineItem {
  id: string;
  title?: string;
  quantity?: number;
  price?: string;
  sku?: string;
  product_id?: string;
  variant_id?: string;
  properties?: any;
  location_id?: string | null;
  location_name?: string | null;
}

// Database line item type
export interface DbLineItem {
  id: string;
  shopify_line_item_id: string;
  title: string;
  order_id: string;
  shopify_order_id: string;
}

// Batch update type for line items
export interface LineItemLocationUpdate {
  id: string;
  location_id: string | null;
  location_name: string | null;
}
