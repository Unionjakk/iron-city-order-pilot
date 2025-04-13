
// Types for the shopify-sync-all function

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface ExtendedRequestBody {
  apiToken?: string;
  filters?: Record<string, any>;
  debug?: boolean;
}

export interface ShopifyOrder {
  id: string;
  order_number: string | number;
  name?: string;
  created_at: string;
  customer?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  shipping_address?: any;
  fulfillment_status: string | null;
  cancelled_at?: string | null;
  closed_at?: string | null;
  status: string;
  line_items?: ShopifyLineItem[];
  note?: string;
}

export interface ShopifyLineItem {
  id: string | number;
  title: string;
  sku?: string;
  quantity: number;
  price: string;
  product_id?: string | number;
  variant_id?: string | number;
  properties?: any;
  location_id?: string | number;
  location_name?: string;
}

export interface SyncResponse {
  success: boolean;
  error: string | null;
  imported: number;
  debugMessages: string[];
  cleaned?: boolean;
}

export function handleCorsPreflightRequest(req: Request): Response | null {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status:
      204,
    });
  }
  return null;
}
