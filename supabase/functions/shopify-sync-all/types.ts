
// Types for Shopify-Sync-All function

export interface ShopifyOrder {
  id: string;
  order_number: string;
  name: string;
  created_at: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  line_items: any[];
  shipping_address: any;
  fulfillment_status: string | null;
  note: string | null;
  line_item_count: number;
  location_id: string;
}

export interface RequestBody {
  apiToken?: string;
}

export interface SyncResponse {
  success: boolean;
  error: string | null;
  imported: number;
  fulfilled: number;
  debugMessages: string[];
}

export interface PaginatedOrdersResponse {
  orders: ShopifyOrder[];
  nextPageUrl: string | null;
}

// CORS headers for all responses
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
