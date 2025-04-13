
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Response interface
interface CountResponse {
  success: boolean;
  error?: string;
  unfulfilled?: number;
  partialFulfilled?: number;
  total?: number;
  debug?: string[];
}

serve(async (req) => {
  console.log("=== Shopify Get Counts Function Started ===");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }
  
  // Initialize response and debug log
  const response: CountResponse = { success: false };
  const debugLogs: string[] = [];
  
  const debug = (message: string) => {
    console.log(message);
    debugLogs.push(message);
  };
  
  try {
    // Parse request body
    const reqData = await req.json();
    debug(`Request received: ${JSON.stringify(reqData)}`);
    
    const { apiToken, apiEndpoint } = reqData;
    
    if (!apiToken) {
      throw new Error("No API token provided");
    }
    
    if (!apiEndpoint) {
      throw new Error("No API endpoint provided");
    }
    
    // Build URLs for unfulfilled and partially fulfilled order counts
    const url = new URL(apiEndpoint);
    
    // First count unfulfilled orders
    url.searchParams.set('status', 'open');
    url.searchParams.set('fulfillment_status', 'unfulfilled');
    url.searchParams.set('limit', '1');
    url.searchParams.set('fields', 'id');
    
    debug(`Checking unfulfilled orders count from ${url.toString()}`);
    
    const unfulfilledResponse = await fetch(url.toString(), {
      headers: {
        'X-Shopify-Access-Token': apiToken,
        'Content-Type': 'application/json'
      }
    });
    
    if (!unfulfilledResponse.ok) {
      const errorBody = await unfulfilledResponse.text();
      throw new Error(`Shopify API error (${unfulfilledResponse.status}): ${errorBody}`);
    }
    
    const unfulfilledData = await unfulfilledResponse.json();
    const unfulfilledCount = parseInt(unfulfilledResponse.headers.get('X-Shopify-Shop-Api-Call-Limit')?.split('/')[1] || '0');
    debug(`Unfulfilled orders count: ${unfulfilledData.count || 'unknown'}`);
    
    // Then count partially fulfilled orders
    url.searchParams.set('fulfillment_status', 'partial');
    
    debug(`Checking partially fulfilled orders count from ${url.toString()}`);
    
    const partialResponse = await fetch(url.toString(), {
      headers: {
        'X-Shopify-Access-Token': apiToken,
        'Content-Type': 'application/json'
      }
    });
    
    if (!partialResponse.ok) {
      const errorBody = await partialResponse.text();
      throw new Error(`Shopify API error (${partialResponse.status}): ${errorBody}`);
    }
    
    const partialData = await partialResponse.json();
    debug(`Partially fulfilled orders count: ${partialData.count || 'unknown'}`);
    
    // Build response
    response.success = true;
    response.unfulfilled = unfulfilledData.count || 0;
    response.partialFulfilled = partialData.count || 0;
    response.total = (unfulfilledData.count || 0) + (partialData.count || 0);
    response.debug = debugLogs;
    
    debug(`Total expected orders: ${response.total}`);
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error: any) {
    debug(`Error: ${error.message}`);
    
    response.error = error.message;
    response.debug = debugLogs;
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
