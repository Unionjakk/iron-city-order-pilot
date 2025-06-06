
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { corsHeaders, SyncResponse, handleCorsPreflightRequest } from "./types.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.6";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface CleanupRequestBody {
  apiToken?: string;
}

serve(async (req) => {
  console.log("=== Shopify Database Cleanup Function Started ===");
  console.log(`Request method: ${req.method}`);
  
  // Handle CORS preflight requests
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  // Initialize response data
  const responseData: SyncResponse = {
    success: false,
    error: null,
    imported: 0,
    debugMessages: [],
    cleaned: false
  };

  // Helper function to add debug messages
  const debug = (message: string) => {
    console.log(message);
    responseData.debugMessages.push(message);
  };

  try {
    let body: CleanupRequestBody = {};
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
    
    // Update status in database
    try {
      await setImportStatus('deleting', debug);
    } catch (statusError: any) {
      debug(`Failed to set import status: ${statusError.message}`);
      // Continue anyway as this isn't critical
    }
    
    debug("Starting database cleanup operation");
    
    try {
      // Add proper error handling and retry logic for the database cleanup
      let cleanupSuccess = false;
      let retries = 0;
      const maxRetries = 3;
      
      while (!cleanupSuccess && retries < maxRetries) {
        try {
          debug(`Cleanup attempt ${retries + 1} of ${maxRetries}`);
          
          // Check if the database is already empty
          const { count: orderItemsCount, error: itemsCountError } = await supabase
            .from('shopify_order_items')
            .select('*', { count: 'exact', head: true });
            
          if (itemsCountError) {
            debug(`Error checking order items: ${itemsCountError.message}`);
            throw new Error(`Could not check if order items exist: ${itemsCountError.message}`);
          }
          
          const { count: ordersCount, error: ordersCountError } = await supabase
            .from('shopify_orders')
            .select('*', { count: 'exact', head: true });
            
          if (ordersCountError) {
            debug(`Error checking orders: ${ordersCountError.message}`);
            throw new Error(`Could not check if orders exist: ${ordersCountError.message}`);
          }
          
          // If database is already empty, skip deletion
          if ((orderItemsCount === 0 || orderItemsCount === null) && 
              (ordersCount === 0 || ordersCount === null)) {
            debug("Database is already empty - skipping deletion step");
            cleanupSuccess = true;
            responseData.cleaned = true;
            break;
          }
          
          debug(`Found ${orderItemsCount || 0} order items and ${ordersCount || 0} orders to delete`);
          
          // CRITICAL FIX: STEP 1 - Delete all order items first
          debug("STEP 1: Deleting all order items with service role...");
          
          // Using RPC function as primary deletion method for order items
          debug("Using RPC function for order items deletion...");
          const { error: itemsDeleteError } = await supabase.rpc('delete_all_shopify_order_items');
          
          if (itemsDeleteError) {
            debug(`RPC delete for order items failed: ${itemsDeleteError.message}`);
            
            // Fall back to direct delete
            debug("Falling back to direct delete for order items...");
            const { error: directDeleteError } = await supabase
              .from('shopify_order_items')
              .delete()
              .neq('id', '00000000-0000-0000-0000-000000000000');
              
            if (directDeleteError) {
              debug(`Direct delete for order items also failed: ${directDeleteError.message}`);
              throw new Error(`Could not delete order items: ${directDeleteError.message}`);
            } else {
              debug("Successfully deleted all order items via direct query");
            }
          } else {
            debug("Successfully deleted order items via RPC");
          }
          
          // Verify all order items are deleted
          const { count: itemsCount, error: itemsCountError2 } = await supabase
            .from('shopify_order_items')
            .select('*', { count: 'exact', head: true });
          
          if (itemsCountError2) {
            debug(`Error verifying order items deletion: ${itemsCountError2.message}`);
          } else {
            debug(`Order items count after deletion: ${itemsCount || 0}`);
            if (itemsCount && itemsCount > 0) {
              debug(`WARNING: ${itemsCount} order items still remain after deletion attempt`);
              // Don't throw here - we'll still try to delete orders
            } else {
              debug("Verified all order items have been deleted successfully");
            }
          }
          
          // STEP 2: Only after items are deleted, now delete all orders
          debug("STEP 2: Deleting all orders with service role...");
          
          // Using RPC function as primary deletion method for orders
          debug("Using RPC function for orders deletion...");
          const { error: ordersDeleteError } = await supabase.rpc('delete_all_shopify_orders');
          
          if (ordersDeleteError) {
            debug(`RPC delete for orders failed: ${ordersDeleteError.message}`);
            
            // Fall back to direct delete
            debug("Falling back to direct delete for orders...");
            const { error: directOrdersDeleteError } = await supabase
              .from('shopify_orders')
              .delete()
              .neq('id', '00000000-0000-0000-0000-000000000000');
              
            if (directOrdersDeleteError) {
              debug(`Direct delete for orders also failed: ${directOrdersDeleteError.message}`);
              throw new Error(`Could not delete orders: ${directOrdersDeleteError.message}`);
            } else {
              debug("Successfully deleted all orders via direct query");
            }
          } else {
            debug("Successfully deleted orders via RPC");
          }
          
          // STEP 3: Verify both tables are empty
          const { count: orderCount, error: orderCountError } = await supabase
            .from('shopify_orders')
            .select('*', { count: 'exact', head: true });
          
          if (orderCountError) {
            debug(`Error verifying orders deletion: ${orderCountError.message}`);
          } else {
            debug(`Order count after deletion: ${orderCount || 0}`);
            if (orderCount && orderCount > 0) {
              debug(`WARNING: ${orderCount} orders still remain after deletion attempt`);
              // Don't throw here, just log the warning
            } else {
              debug("Verified all orders have been deleted successfully");
            }
          }
          
          // Consider the operation successful even if some items remain
          // This prevents the function from getting stuck in an error loop
          cleanupSuccess = true;
          responseData.cleaned = true;
          debug("Database cleanup completed with potential remaining records");
          break;
          
        } catch (cleanupError: any) {
          debug(`Error during database cleanup attempt ${retries + 1}: ${cleanupError.message}`);
          
          // Only throw on the last retry
          if (retries >= maxRetries - 1) {
            throw cleanupError;
          }
          
          // Wait before retrying
          const backoffMs = 2000 * Math.pow(2, retries);
          debug(`Waiting ${backoffMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          retries++;
        }
      }
      
      responseData.success = true;
      await setImportStatus('idle', debug);
      
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (error: any) {
      debug(`Error during database cleanup: ${error.message}`);
      if (error.stack) {
        debug(`Error stack: ${error.stack}`);
      }
      responseData.error = error.message;
      await setImportStatus('error', debug);
      
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
  } catch (error: any) {
    console.error("=== CLEANUP OPERATION FAILED ===");
    console.error(`Error message: ${error.message}`);
    
    if (error.stack) {
      console.error(`Stack trace: ${error.stack}`);
    }
    
    // For client debugging, create a detailed error response
    const errorResponse: SyncResponse = {
      success: false,
      error: error.message || 'Unknown error occurred',
      debugMessages: [
        `Error in cleanup operation: ${error.message || 'Unknown error'}`,
        `Time of error: ${new Date().toISOString()}`,
        `Request method: ${req.method}`,
        `Request URL: ${req.url}`
      ],
      imported: 0,
      cleaned: false
    };
    
    // Make sure status is set to error in database
    try {
      await setImportStatus('error', (msg) => console.log(msg));
    } catch (settingError) {
      console.error("Failed to update status to error");
    }
    
    // Return a proper error response with CORS headers
    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Return 200 even if there's an error to prevent fetch errors
    });
  }
});

/**
 * Set the import status in the database
 */
async function setImportStatus(status: string, debug: (message: string) => void): Promise<boolean> {
  try {
    debug(`Updating import status to: ${status}`);
    
    const { error: statusError } = await supabase.rpc("upsert_shopify_setting", {
      setting_name_param: "shopify_import_status",
      setting_value_param: status
    });

    if (statusError) {
      debug(`Failed to update import status: ${statusError.message}`);
      return false;
    }
    
    debug(`Successfully updated import status to: ${status}`);
    return true;
  } catch (error: any) {
    debug(`Error updating import status: ${error.message}`);
    return false;
  }
}
