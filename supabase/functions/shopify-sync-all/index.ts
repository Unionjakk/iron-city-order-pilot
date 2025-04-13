
// Supabase Edge Function
// This function handles importing ONLY ACTIVE unfulfilled and partially fulfilled orders from Shopify
// It does not import archived orders or fulfilled orders

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { ExtendedRequestBody, SyncResponse, corsHeaders, ImportProgress } from "./types.ts";
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
  setImportStatus,
  updateImportProgress
} from "./database.ts";
import { debug, debugObject, logError } from "./debugUtils.ts";

// Create a flag to track if another operation is already in progress
let isImportInProgress = false;

serve(async (req) => {
  debug("=== Shopify Sync ALL Function Started ===");
  debug(`Request method: ${req.method}`);
  
  // Handle CORS preflight requests
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  // Initialize response data
  const responseData: SyncResponse = {
    success: false,
    error: null,
    imported: 0,
    debugMessages: []
  };

  // Check if import is already in progress
  if (isImportInProgress) {
    debug("Another import operation is already in progress");
    responseData.error = "Another import operation is already in progress";
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 409, // Conflict
    });
  }

  try {
    // Set flag to indicate import is in progress
    isImportInProgress = true;
    
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
    
    // Get filters from request or use defaults
    const filters = body.filters || {
      status: "open", 
      fulfillment_status: "unfulfilled,partial"
    };
    debug(`Using filters: ${JSON.stringify(filters)}`);
    
    // Track progress if requested
    const trackProgress = body.trackProgress !== false;
    
    // Standard import operation
    debug("Starting import of ACTIVE UNFULFILLED and PARTIALLY FULFILLED orders from Shopify");
    debug("NOTE: This function does NOT import archived orders or fulfilled orders");
    
    await setImportStatus('importing', debug);

    // Initialize import progress
    if (trackProgress) {
      const initialProgress: ImportProgress = {
        ordersTotal: 0,
        ordersImported: 0,
        orderItemsTotal: 0,
        orderItemsImported: 0,
        status: 'importing',
        lastUpdated: new Date().toISOString()
      };
      await updateImportProgress(initialProgress, debug);
      responseData.importProgress = initialProgress;
    }

    try {
      // Get API endpoint from database
      const apiEndpoint = await getShopifyApiEndpoint(debug);
      
      // Log the endpoint for debugging
      debug(`Using Shopify API endpoint: ${apiEndpoint}`);
      
      const filteredApiEndpoint = buildFilteredShopifyEndpoint(apiEndpoint, filters, debug);

      // STEP 1: Fetch orders from Shopify with proper pagination and filtering
      debug(`Fetching orders from Shopify with status=${filters.status} and fulfillment_status=${filters.fulfillment_status}`);
      
      // Add detailed logging of API call
      debug(`Making API call to: ${filteredApiEndpoint}`);
      debug(`Using API token with length: ${apiToken.length} characters`);
      
      const shopifyOrders = await importOrdersFromShopify(apiToken, filteredApiEndpoint, debug);
      
      // Log the number of orders returned from the API for debugging
      debug(`Received ${shopifyOrders.length} orders from Shopify API`);
      
      // Update progress with total expected orders
      if (trackProgress) {
        const orderItemsCount = shopifyOrders.reduce((count, order) => {
          return count + (order.line_items?.length || 0);
        }, 0);
        
        const updatedProgress: ImportProgress = {
          ordersTotal: shopifyOrders.length,
          ordersImported: 0,
          orderItemsTotal: orderItemsCount,
          orderItemsImported: 0,
          status: 'importing',
          lastUpdated: new Date().toISOString()
        };
        await updateImportProgress(updatedProgress, debug);
        responseData.importProgress = updatedProgress;
      }
      
      // Double-check orders to ensure they match our criteria
      const filteredOrders = filterActiveUnfulfilledOrders(shopifyOrders, debug);
      
      // Log the number of orders after filtering
      debug(`After filtering, ${filteredOrders.length} orders match our criteria (unfulfilled/partial + active)`);
      
      // Dump sample order for debugging if available
      if (filteredOrders.length > 0) {
        debug(`Sample order ID: ${filteredOrders[0].id}, order number: ${filteredOrders[0].order_number}`);
        debug(`Sample order status: ${filteredOrders[0].status}, fulfillment status: ${filteredOrders[0].fulfillment_status}`);
        
        // Log full details of first order for debugging
        debugObject("Sample order details", filteredOrders[0]);
      } else {
        debug("No orders matched our filter criteria. Check if there are any unfulfilled/partially fulfilled orders in Shopify");
      }

      // Count total line items for logging
      let totalLineItems = 0;
      filteredOrders.forEach(order => {
        if (order.line_items && Array.isArray(order.line_items)) {
          totalLineItems += order.line_items.length;
        }
      });
      debug(`Total line items to import: ${totalLineItems}`);

      // Custom import function that updates progress
      const importWithProgress = async (order: any, orderId: string, orderNumber: string, debug: (message: string) => void): Promise<boolean> => {
        const result = await importOrder(order, orderId, orderNumber, debug);
        
        // Update progress after each order import
        if (trackProgress && result) {
          const lineItemsCount = order.line_items?.length || 0;
          responseData.importProgress = {
            ...responseData.importProgress!,
            ordersImported: responseData.importProgress!.ordersImported + 1,
            orderItemsImported: responseData.importProgress!.orderItemsImported + lineItemsCount,
            lastUpdated: new Date().toISOString()
          };
          await updateImportProgress(responseData.importProgress, debug);
        }
        
        return result;
      };

      // STEP 2: Import filtered orders in batches
      responseData.imported = await processOrdersInBatches(
        filteredOrders,
        trackProgress ? importWithProgress : importOrder,
        debug
      );
      
      // Log final import results
      debug(`Successfully imported ${responseData.imported} of ${filteredOrders.length} orders`);
      
    } catch (error) {
      logError("Error in Shopify API operations", error);
      await setImportStatus('error', debug);
      throw error;
    }

    // STEP 3: Update last sync time in settings
    await updateLastSyncTime(debug);
    await setImportStatus('idle', debug);
    
    // Finalize import progress
    if (trackProgress && responseData.importProgress) {
      responseData.importProgress.status = 'complete';
      responseData.importProgress.lastUpdated = new Date().toISOString();
      await updateImportProgress(responseData.importProgress, debug);
    }
    
    responseData.success = true;
    debug("Shopify sync completed successfully");
    debug(`Summary: Imported ${responseData.imported} active unfulfilled/partially fulfilled orders`);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    logError("Error in Shopify sync", error);
    responseData.error = error.message;
    
    // Make sure status is set to error in database
    await setImportStatus('error', debug);
    
    // Update progress status if tracking is enabled
    if (responseData.importProgress) {
      responseData.importProgress.status = 'error';
      responseData.importProgress.lastUpdated = new Date().toISOString();
      await updateImportProgress(responseData.importProgress, debug);
    }
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400, 
    });
  } finally {
    // Reset the import progress flag
    isImportInProgress = false;
  }
});
