
// Supabase Edge Function
// This function handles importing ALL orders from Shopify
// It imports all orders without archiving

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { 
  RequestBody, 
  SyncResponse, 
  corsHeaders, 
  ShopifyOrder 
} from "./types.ts";
import { 
  fetchAllShopifyOrdersWithPagination, 
  fetchNextPage 
} from "./shopifyApi.ts";
import { 
  importOrder, 
  updateLastSyncTime,
  getShopifyApiEndpoint,
  supabase
} from "./database.ts";

serve(async (req) => {
  console.log("=== Shopify Sync ALL Function Started ===");
  console.log(`Request method: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize response data
  const responseData: SyncResponse = {
    success: false,
    error: null,
    imported: 0,
    debugMessages: []
  };

  // Helper function to add debug messages
  const debug = (message: string) => {
    console.log(message);
    responseData.debugMessages.push(message);
  };

  try {
    let body: RequestBody = {};
    try {
      body = await req.json();
      debug(`Request body parsed successfully: ${JSON.stringify(body)}`);
    } catch (err) {
      debug("Empty or invalid request body");
      throw new Error("Invalid request body");
    }

    // Get API token from request
    let apiToken = body.apiToken;
    
    // Validate the API token
    if (!apiToken) {
      debug("No API token provided");
      throw new Error("No API token provided");
    }
    
    debug("Starting import of ALL orders from Shopify");

    try {
      // Get API endpoint from database
      const apiEndpoint = await getShopifyApiEndpoint(debug);
      debug(`Using Shopify API endpoint: ${apiEndpoint}`);

      // STEP 1: Fetch ALL orders from Shopify with proper pagination
      debug("Fetching ALL orders from Shopify");
      let shopifyOrders: ShopifyOrder[] = [];
      let nextPageUrl: string | null = null;
      
      // First page of orders - get all orders
      const firstPageResult = await fetchAllShopifyOrdersWithPagination(apiToken, apiEndpoint);
      shopifyOrders = firstPageResult.orders;
      nextPageUrl = firstPageResult.nextPageUrl;
      
      debug(`Retrieved ${shopifyOrders.length} orders from first page`);
      
      // Continue fetching if there are more pages
      let pageCount = 1;
      // No page limit - fetch all orders
      
      while (nextPageUrl) {
        pageCount++;
        debug(`Fetching page ${pageCount} from ${nextPageUrl}`);
        
        try {
          const nextPageResult = await fetchNextPage(apiToken, nextPageUrl);
          shopifyOrders = [...shopifyOrders, ...nextPageResult.orders];
          nextPageUrl = nextPageResult.nextPageUrl;
          
          debug(`Retrieved ${nextPageResult.orders.length} more orders from page ${pageCount}`);
        } catch (err) {
          debug(`Error fetching page ${pageCount}: ${err.message}`);
          break; // Stop pagination on error but continue with orders we have
        }
        
        // Add a small delay to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      debug(`Total orders retrieved: ${shopifyOrders.length}`);

      // STEP 2: Import all orders regardless of fulfillment status
      for (const shopifyOrder of shopifyOrders) {
        const orderNumber = shopifyOrder.name;
        const orderId = shopifyOrder.id;
        
        debug(`Processing order: ${orderId} (${orderNumber}) - Status: ${shopifyOrder.fulfillment_status || "unfulfilled"}`);

        // Import all orders into the active orders table
        const success = await importOrder(shopifyOrder, orderId, orderNumber, debug);
        if (success) {
          responseData.imported++;
        }
      }
    } catch (error) {
      debug(`Error in Shopify API operations: ${error.message}`);
      throw error;
    }

    // STEP 3: Update last sync time in settings
    await updateLastSyncTime(debug);
    
    responseData.success = true;
    debug("Shopify sync ALL completed successfully");
    debug(`Summary: Imported ${responseData.imported} orders`);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    debug(`Error in Shopify sync ALL: ${error.message}`);
    responseData.error = error.message;
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
