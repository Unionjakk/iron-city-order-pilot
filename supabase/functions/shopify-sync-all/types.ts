
/**
 * Type definitions for Shopify sync functions
 */

// CORS headers for API responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Request body for API calls
export interface RequestBody {
  apiToken?: string;
}

// Extended request body with operation type
export interface ExtendedRequestBody extends RequestBody {
  operation?: "import" | "clean";
}

// Response for sync operations
export interface SyncResponse {
  success: boolean;
  error: string | null;
  imported: number;
  debugMessages: string[];
  cleaned?: boolean;
}

// Shopify order structure
export interface ShopifyOrder {
  id: string;
  name?: string;
  order_number?: string;
  created_at?: string;
  updated_at?: string;
  cancelled_at?: string | null;
  closed_at?: string | null;
  processed_at?: string | null;
  customer?: {
    id?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
  line_items?: ShopifyLineItem[];
  shipping_address?: any;
  billing_address?: any;
  financial_status?: string;
  fulfillment_status?: string | null;
  note?: string;
  [key: string]: any;
}

// Shopify line item structure
export interface ShopifyLineItem {
  id: string;
  title?: string;
  variant_id?: string;
  product_id?: string;
  sku?: string;
  quantity?: number;
  price?: string;
  location_id?: string | null;
  location_name?: string | null;
  properties?: any[];
  [key: string]: any;
}
