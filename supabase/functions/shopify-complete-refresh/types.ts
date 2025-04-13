
export interface SyncResponse {
  success: boolean;
  error: string | null;
  imported: number;
  debugMessages: string[];
  cleaned?: boolean;
  syncStarted?: boolean;
  syncComplete?: boolean;
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface CompleteRefreshRequestBody {
  apiToken?: string;
  filters?: {
    status?: string;
    fulfillment_status?: string;
    [key: string]: string | undefined;
  };
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
