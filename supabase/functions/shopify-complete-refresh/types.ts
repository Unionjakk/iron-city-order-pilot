
export interface SyncResponse {
  success: boolean;
  error: string | null;
  imported: number;
  debugMessages: string[];
  cleaned?: boolean;
  syncStarted?: boolean;
  syncComplete?: boolean;
  orderCounts?: {
    unfulfilled: number;
    partiallyFulfilled: number;
    expected: number;
    imported?: number;
  };
  sampleOrderData?: any; // Adding field to store sample order data for debugging
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface CompleteRefreshRequestBody {
  apiToken?: string;
  operation?: string; 
  filters?: {
    status?: string;
    fulfillment_status?: string;
    [key: string]: string | undefined;
  };
  debug?: boolean; // Add debug flag to return sample data
}

export function handleCorsPreflightRequest(req: Request) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
  return null;
}
