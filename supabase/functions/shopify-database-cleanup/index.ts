
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
    await setImportStatus('deleting', debug);
    
    debug("Starting database cleanup operation");
    
    try {
      // Add proper error handling and retry logic for the database cleanup
      let cleanupSuccess = false;
      let retries = 0;
      const maxRetries = 3;
      
      while (!cleanupSuccess && retries < maxRetries) {
        try {
          debug(`Cleanup attempt ${retries + 1} of ${maxRetries}`);
          
          // STEP 1: Delete all order items first - explicitly use SQL for more reliable deletion
          debug("Deleting all order items with service role...");
          const { error: itemsDeleteError } = await supabase.rpc('delete_all_shopify_order_items');
          
          if (itemsDeleteError) {
            debug(`Error deleting order items: ${itemsDeleteError.message}`);
            throw new Error(`Could not delete order items: ${itemsDeleteError.message}`);
          }
          debug("Successfully deleted all order items");
          
          // STEP 2: Then delete all orders - explicitly use SQL for more reliable deletion
          debug("Deleting all orders with service role...");
          const { error: ordersDeleteError } = await supabase.rpc('delete_all_shopify_orders');
          
          if (ordersDeleteError) {
            debug(`Error deleting orders: ${ordersDeleteError.message}`);
            throw new Error(`Could not delete orders: ${ordersDeleteError.message}`);
          }
          debug("Successfully deleted all orders");
          
          // STEP 3: Verify both tables are empty
          const { count: orderCount, error: orderCountError } = await supabase
            .from('shopify_orders')
            .select('*', { count: 'exact', head: true });
          
          if (orderCountError) {
            debug(`Error verifying orders deletion: ${orderCountError.message}`);
          } else if (orderCount && orderCount > 0) {
            debug(`WARNING: ${orderCount} orders still remain after deletion attempt`);
            throw new Error(`Failed to delete all orders, ${orderCount} orders remain`);
          } else {
            debug("Verified all orders have been deleted successfully");
          }
          
          const { count: itemCount, error: itemCountError } = await supabase
            .from('shopify_order_items')
            .select('*', { count: 'exact', head: true });
          
          if (itemCountError) {
            debug(`Error verifying order items deletion: ${itemCountError.message}`);
          } else if (itemCount && itemCount > 0) {
            debug(`WARNING: ${itemCount} order items still remain after deletion attempt`);
            throw new Error(`Failed to delete all order items, ${itemCount} order items remain`);
          } else {
            debug("Verified all order items have been deleted successfully");
          }
          
          cleanupSuccess = true;
          debug("Database cleanup completed successfully on attempt " + (retries + 1));
          break;
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
          retries++;
        }
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
        status: 400,
      });
    }
  } catch (error: any) {
    debug(`Error in database cleanup: ${error.message}`);
    responseData.error = error.message;
    
    // Make sure status is set to error in database
    await setImportStatus('error', debug);
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

// Helper function to set import status in database
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
