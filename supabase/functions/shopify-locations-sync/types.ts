export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface RequestBody {
  apiToken?: string;
  mode?: "batch" | "single" | "bulk" | "list_locations";
  orderId?: string;
  lineItemId?: string;
}

export interface SyncResponse {
  success: boolean;
  error: string | null;
  updated: number;
  debugMessages: string[];
  totalItems?: number;
  apiResponse?: any;
  locations?: any[];
}

export interface ShopifyOrder {
  id: string;
  name: string;
  created_at: string;
  customer?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  line_items: ShopifyLineItem[];
  shipping_address?: any;
  note?: string;
  fulfillment_status?: string;
  fulfillments?: any[];
  locations?: any[];
  order_number?: string;
}

export interface ShopifyLineItem {
  id: string;
  title: string;
  quantity: number;
  price: string;
  sku?: string;
  product_id?: string;
  variant_id?: string;
  properties?: any;
  origin_location?: {
    id: string;
    name: string;
  };
  location_id?: string | null;
  location_name?: string | null;
}

export interface DbLineItem {
  id: string;
  order_id: string;
  shopify_line_item_id: string;
  shopify_order_id: string;
  title: string;
}

export interface LineItemLocationUpdate {
  id: string;
  location_id: string | null;
  location_name: string | null;
}
