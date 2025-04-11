
// Types for Shopify Orders API

export interface ShopifyOrder {
  id: string;
  name: string;
  order_number?: string;
  created_at?: string;
  customer?: any;
  line_items?: ShopifyLineItem[];
  fulfillment_status?: string | null;
  financial_status?: string;
  fulfillments?: any[];
  cancelled_at?: string | null;
  closed_at?: string | null;
}

export interface ShopifyLineItem {
  id: string;
  variant_id?: string;
  title?: string;
  quantity?: number;
  sku?: string;
  variant_title?: string;
  vendor?: string;
  fulfillment_service?: string;
  requires_shipping?: boolean;
  taxable?: boolean;
  gift_card?: boolean;
  name?: string;
  price?: string;
  fulfillment_status?: string | null;
  location_id?: string | null;
  location_name?: string | null;
}

export interface LineItemLocationUpdate {
  id: string;
  location_id: string | null;
  location_name: string | null;
}

export interface DbLineItem {
  id: string;
  shopify_line_item_id: string;
  title?: string;
  order_id: string;
  location_id?: string | null;
  location_name?: string | null;
}

export interface RequestBody {
  apiToken?: string;
  mode?: "batch" | "single" | "list_locations";
  orderId?: string;
  lineItemId?: string;
  includeDebugData?: boolean;
}

export interface SyncResponse {
  success: boolean;
  error: string | null;
  updated: number;
  totalItems?: number;
  locations?: any[];
  apiResponse?: any;
  debugMessages: string[];
  debugData?: {
    request?: string;
    response?: string;
  };
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
