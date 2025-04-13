
// Supabase Edge Function
// This function handles importing ONLY ACTIVE unfulfilled and partially fulfilled orders from Shopify
// It does not import archived orders or fulfilled orders

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { ExtendedRequestBody, SyncResponse, corsHeaders } from "./types.ts";
import { handleCorsPreflightRequest } from "./corsUtils.ts";
import { 
  importOrdersFromShopify, 
  filterActiveUnfulfilledOrders,
  processOrdersInBatches,
  buildFilteredShopifyEndpoint
} from "./importUtils.ts";
import { 
  importOrder, 
  updateLastSyncTime,
  getShopifyApiEndpoint,
  cleanDatabaseCompletely,
  setImportStatus
} from "./database.ts";

serve(async (req) => {
  console.log("=== Shopify Sync ALL Function Started ===");
  console.log(`Request method: ${req.method}`);
  
  // Handle CORS preflight requests
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

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
    
    // Get filters from request or use defaults
    const filters = body.filters || {
      status: "open", 
      fulfillment_status: "unfulfilled,partial"
    };
    debug(`Using filters: ${JSON.stringify(filters)}`);
    
    // Clean database operation
    if (operation === "clean") {
      debug("Starting CLEAN operation to delete all Shopify orders and items");
      await setImportStatus('deleting', debug);
      
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
        await setImportStatus('idle', debug);
        
        return new Response(JSON.stringify(responseData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } catch (error) {
        debug(`Error during database cleanup: ${error.message}`);
        await setImportStatus('error', debug);
        
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
    
    await setImportStatus('importing', debug);

    try {
      // Get API endpoint from database
      const apiEndpoint = await getShopifyApiEndpoint(debug);
      const filteredApiEndpoint = buildFilteredShopifyEndpoint(apiEndpoint, filters, debug);

      // STEP 1: Fetch orders from Shopify with proper pagination and filtering
      debug(`Fetching orders from Shopify with status=${filters.status} and fulfillment_status=${filters.fulfillment_status}`);
      const shopifyOrders = await importOrdersFromShopify(apiToken, filteredApiEndpoint, debug);
      
      // Double-check orders to ensure they match our criteria
      const filteredOrders = filterActiveUnfulfilledOrders(shopifyOrders, debug);

      // Count total line items for logging
      let totalLineItems = 0;
      filteredOrders.forEach(order => {
        if (order.line_items && Array.isArray(order.line_items)) {
          totalLineItems += order.line_items.length;
        }
      });
      debug(`Total line items to import: ${totalLineItems}`);

      // STEP 2: Import filtered orders in batches
      responseData.imported = await processOrdersInBatches(
        filteredOrders,
        importOrder,
        debug
      );
    } catch (error) {
      debug(`Error in Shopify API operations: ${error.message}`);
      await setImportStatus('error', debug);
      throw error;
    }

    // STEP 3: Update last sync time in settings
    await updateLastSyncTime(debug);
    await setImportStatus('idle', debug);
    
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
    
    // Make sure status is set to error in database
    await setImportStatus('error', debug);
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400, // Changed from 500 to 400 for client errors
    });
  }
});
