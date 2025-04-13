
// Types for the shopify-complete-refresh function

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface CompleteRefreshRequestBody {
  apiToken?: string;
  operation?: string;
  filters?: Record<string, string>;
  debug?: boolean;
  trackProgress?: boolean;
}

export interface OrderCounts {
  unfulfilled: number;
  partiallyFulfilled: number;
  expected: number;
}

export interface SyncResponse {
  success: boolean;
  error: string | null;
  imported?: number;
  debugMessages: string[];
  syncStarted?: boolean;
  syncComplete?: boolean;
  orderCounts?: OrderCounts;
  cleaned?: boolean;
  sampleOrderData?: any;
}

export function handleCorsPreflightRequest(req: Request): Response | null {
  // This handles the OPTIONS preflight request for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  return null;
}
