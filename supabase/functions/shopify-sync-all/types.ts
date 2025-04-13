
// Types used by the shopify-sync-all function

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface ExtendedRequestBody {
  apiToken?: string;
  operation?: string;
  filters?: Record<string, string>;
  debug?: boolean;
  trackProgress?: boolean;
}

export interface ShopifyOrder {
  id: string;
  order_number: string;
  name?: string;
  line_items?: any[];
  customer?: {
    first_name?: string;
    last_name?: string;
  };
  fulfillment_status?: string | null;
  status?: string;
  cancelled_at?: string | null;
  closed_at?: string | null;
  created_at?: string;
}

export interface ImportProgress {
  ordersTotal: number;
  ordersImported: number;
  orderItemsTotal: number;
  orderItemsImported: number;
  status: 'idle' | 'importing' | 'complete' | 'error';
  lastUpdated: string;
}

export interface SyncResponse {
  success: boolean;
  error: string | null;
  imported: number;
  debugMessages: string[];
  importProgress?: ImportProgress;
}
