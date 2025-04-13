// Supabase Edge Function
// This function handles importing ONLY ACTIVE unfulfilled and partially fulfilled orders from Shopify
// It does not import archived orders or fulfilled orders

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
  supabase,
  cleanDatabaseCompletely
} from "./database.ts";

// Extended request body with operation type
interface ExtendedRequestBody extends RequestBody {
  operation?: "import" | "clean";
}

serve(async (req) => {
  console.log("=== Shopify Sync ALL Function Started ===");
  console.log(`Request method: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize response data
  const responseData: SyncResponse & { cleaned?: boolean } = {
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
    let body: ExtendedRequestBody = {};
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
    
    // Check for operation type
    const operation = body.operation || "import";
    debug(`Operation type: ${operation}`);
    
    // Clean database operation
    if (operation === "clean") {
      debug("Starting CLEAN operation to delete all Shopify orders and items");
      try {
        // Add proper error handling and retry logic for the database cleanup
        let cleanupSuccess = false;
        let retries = 0;
        const maxRetries = 3;
        
        while (!cleanupSuccess && retries < maxRetries) {
          try {
            // Call our service function to clean the database
            debug(`Cleanup attempt ${retries + 1} of ${maxRetries}`);
            cleanupSuccess = await cleanDatabaseCompletely(debug);
            
            if (cleanupSuccess) {
              debug("Database cleanup completed successfully on attempt " + (retries + 1));
              break;
            }
          } catch (cleanupError) {
            debug(`Error during database cleanup attempt ${retries + 1}: ${cleanupError.message}`);
            
            // Only throw on the last retry
            if (retries >= maxRetries - 1) {
              throw cleanupError;
            }
            
            // Wait before retrying
            const backoffMs = 2000 * Math.pow(2, retries);
            debug(`Waiting ${backoffMs}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          }
          retries++;
        }
        
        responseData.success = true;
        responseData.cleaned = cleanupSuccess;
        
        return new Response(JSON.stringify(responseData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } catch (error) {
        debug(`Error during database cleanup: ${error.message}`);
        
        // Return specific error response with 400 status
        responseData.error = `Database cleanup failed: ${error.message}`;
        return new Response(JSON.stringify(responseData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400, // Changed from 500 to 400 for client errors
        });
      }
    }
    
    // Standard import operation
    debug("Starting import of ACTIVE UNFULFILLED and PARTIALLY FULFILLED orders from Shopify");
    debug("NOTE: This function does NOT import archived orders or fulfilled orders");

    try {
      // Get API endpoint from database
      const apiEndpoint = await getShopifyApiEndpoint(debug);
      debug(`Base Shopify API endpoint: ${apiEndpoint}`);
      
      // Modify the endpoint URL to specifically filter for open orders with unfulfilled or partial status
      // This is the key change to ensure we ONLY get active, unfulfilled orders
      const url = new URL(apiEndpoint);
      
      // Add specific filters for status and fulfillment_status
      url.searchParams.set('status', 'open'); // Only get open (active) orders
      url.searchParams.set('fulfillment_status', 'partial,unfulfilled'); // Only unfulfilled or partially fulfilled
      
      const filteredApiEndpoint = url.toString();
      debug(`Using filtered Shopify API endpoint: ${filteredApiEndpoint}`);

      // STEP 1: Fetch orders from Shopify with proper pagination and filtering
      debug("Fetching orders from Shopify with status=open and fulfillment_status=partial,unfulfilled");
      let shopifyOrders: ShopifyOrder[] = [];
      let nextPageUrl: string | null = null;
      
      // First page of orders - with our specific filters already applied
      const firstPageResult = await fetchAllShopifyOrdersWithPagination(apiToken, filteredApiEndpoint);
      shopifyOrders = firstPageResult.orders;
      nextPageUrl = firstPageResult.nextPageUrl;
      
      debug(`Retrieved ${shopifyOrders.length} orders from first page`);
      
      // Continue fetching if there are more pages
      let pageCount = 1;
      
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

      // Even though we're already filtering in the API call, do a double-check on the orders
      debug("Double-checking orders to confirm only ACTIVE unfulfilled and partially fulfilled orders are included");
      const filteredOrders = shopifyOrders.filter(order => {
        // Include orders that are unfulfilled or partially_fulfilled
        const status = order.fulfillment_status || "unfulfilled";
        
        // Check if order is cancelled or archived
        const isCancelled = order.cancelled_at != null;
        const isArchived = order.closed_at != null;
        
        // Extra verification that we only include active (not cancelled or archived) 
        // unfulfilled/partially fulfilled orders
        return (status === "unfulfilled" || status === "partially_fulfilled") && 
               !isCancelled && 
               !isArchived;
      });
      
      debug(`After double-check: ${filteredOrders.length} active unfulfilled/partially fulfilled orders out of ${shopifyOrders.length} total orders`);

      // Count total line items for logging
      let totalLineItems = 0;
      filteredOrders.forEach(order => {
        if (order.line_items && Array.isArray(order.line_items)) {
          totalLineItems += order.line_items.length;
        }
      });
      debug(`Total line items to import: ${totalLineItems}`);

      // STEP 2: Import filtered orders
      for (const shopifyOrder of filteredOrders) {
        const orderNumber = shopifyOrder.name;
        const orderId = shopifyOrder.id;
        const orderStatus = shopifyOrder.fulfillment_status || "unfulfilled";
        
        // Log line items count for debugging
        const lineItemsCount = shopifyOrder.line_items?.length || 0;
        debug(`Processing order: ${orderId} (${orderNumber}) - Status: ${orderStatus} - Has ${lineItemsCount} line items`);

        if (!shopifyOrder.line_items || !Array.isArray(shopifyOrder.line_items) || shopifyOrder.line_items.length === 0) {
          debug(`WARNING: Order ${orderId} (${orderNumber}) has no line items or invalid line_items format`);
          debug(`line_items value: ${JSON.stringify(shopifyOrder.line_items)}`);
        }

        // Import order into the active orders table
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
    debug("Shopify sync completed successfully");
    debug(`Summary: Imported ${responseData.imported} active unfulfilled/partially fulfilled orders`);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    debug(`Error in Shopify sync: ${error.message}`);
    responseData.error = error.message;
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400, // Changed from 500 to 400 for client errors
    });
  }
});
