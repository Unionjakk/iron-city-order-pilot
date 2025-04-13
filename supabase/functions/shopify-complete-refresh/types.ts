
// Essential types for the shopify-complete-refresh function

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface SyncResponse {
  success: boolean;
  error: string | null;
  imported?: number;
  debugMessages: string[];
  cleaned?: boolean;
  syncComplete?: boolean;
  syncStarted?: boolean;
  orderCounts?: {
    expected?: number;
    imported?: number;
    unfulfilled?: number;
    partiallyFulfilled?: number;
  };
  sampleOrderData?: any;
}

export interface CompleteRefreshRequestBody {
  apiToken?: string;
  operation?: string;
  filters?: Record<string, any>;
  debug?: boolean;
}

export function handleCorsPreflightRequest(req: Request): Response | null {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  return null;
}
