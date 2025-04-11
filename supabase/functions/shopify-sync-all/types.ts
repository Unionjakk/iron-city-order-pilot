
// CORS headers for browser requests
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// API request body for Shopify sync
export interface RequestBody {
  apiToken?: string;
  autoImport?: boolean;
  timestamp?: number;
}

// API response body for Shopify sync
export interface SyncResponse {
  success: boolean;
  error: string | null;
  imported: number;
  debugMessages: string[];
}

// Shopify API order interface
export interface ShopifyOrder {
  id: string;
  name: string;
  order_number: string;
  created_at: string;
  customer?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  line_items?: ShopifyLineItem[];
  shipping_address?: any;
  fulfillment_status?: string | null;
  note?: string | null;
  line_item_count?: number;
}

// Shopify API line item interface with location data
export interface ShopifyLineItem {
  id?: string;
  title?: string;
  quantity?: number;
  price?: string;
  sku?: string;
  product_id?: string;
  variant_id?: string;
  properties?: any;
  location_id?: string;
  location_name?: string;
}
