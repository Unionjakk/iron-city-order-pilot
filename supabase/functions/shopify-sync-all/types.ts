import { ShopifyOrder } from "./shopifyOrdersApi.ts";

export interface SyncResponse {
  success: boolean;
  error: string | null;
  imported: number;
  debugMessages: string[];
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface ExtendedRequestBody {
  apiToken?: string;
  operation?: 'import' | 'clean';
  filters?: {
    status?: string;
    fulfillment_status?: string;
    [key: string]: string | undefined;
  };
}
