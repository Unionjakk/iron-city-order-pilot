
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { corsHeaders, SyncResponse, handleCorsPreflightRequest } from "./types.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.6";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

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
    let body: { apiToken?: string } = {};
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
    
    debug("Starting database cleanup operation");
    
    // CRITICAL FIX: STEP 1 - Delete all order items first
    debug("STEP 1: Deleting all order items with service role...");
    
    try {
      // Use RPC function as primary deletion method for order items
      debug("Using RPC function for order items deletion...");
      const { error: itemsDeleteError } = await supabase.rpc('delete_all_shopify_order_items');
      
      if (itemsDeleteError) {
        debug(`RPC delete for order items failed: ${itemsDeleteError.message}`);
        
        // Fall back to direct delete with a smaller batch size to avoid timeouts
        debug("Falling back to direct delete for order items in batches...");
        
        // Get all order item IDs
        const { data: allOrderItemIds, error: idsError } = await supabase
          .from('shopify_order_items')
          .select('id')
          .limit(10000);
          
        if (idsError) {
          debug(`Error getting order item IDs: ${idsError.message}`);
          throw new Error(`Could not get order item IDs: ${idsError.message}`);
        }
        
        if (allOrderItemIds && allOrderItemIds.length > 0) {
          // Delete in batches of 500
          const batchSize = 500;
          for (let i = 0; i < allOrderItemIds.length; i += batchSize) {
            const batchIds = allOrderItemIds.slice(i, i + batchSize).map(item => item.id);
            debug(`Deleting batch ${i/batchSize + 1} of ${Math.ceil(allOrderItemIds.length/batchSize)}: ${batchIds.length} items`);
            
            const { error: batchDeleteError } = await supabase
              .from('shopify_order_items')
              .delete()
              .in('id', batchIds);
              
            if (batchDeleteError) {
              debug(`Error deleting batch: ${batchDeleteError.message}`);
              throw new Error(`Batch delete failed: ${batchDeleteError.message}`);
            }
            
            // Add a small delay between batches
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          debug("Successfully deleted all order items in batches");
        } else {
          debug("No order items found to delete");
        }
      } else {
        debug("Successfully deleted order items via RPC");
      }
    } catch (deleteError: any) {
      debug(`Error during order items deletion: ${deleteError.message}`);
      throw deleteError;
    }
    
    // STEP 2: After deleting items, now delete orders
    debug("STEP 2: Deleting all orders with service role...");
    
    try {
      // Using RPC function as primary deletion method for orders
      debug("Using RPC function for orders deletion...");
      const { error: ordersDeleteError } = await supabase.rpc('delete_all_shopify_orders');
      
      if (ordersDeleteError) {
        debug(`RPC delete for orders failed: ${ordersDeleteError.message}`);
        throw new Error(`Orders deletion failed: ${ordersDeleteError.message}`);
      } else {
        debug("Successfully deleted orders via RPC");
      }
    } catch (deleteOrdersError: any) {
      debug(`Error during orders deletion: ${deleteOrdersError.message}`);
      throw deleteOrdersError;
    }
    
    // NEW CODE: Reset the shopify_orders_imported and shopify_orders_lines_imported counters to 0
    // This ensures that the subsequent import process will have the correct counts
    debug("STEP 3: Resetting shopify order counters in settings...");
    
    try {
      // Reset orders imported counter
      const { error: resetOrdersError } = await supabase.rpc("upsert_shopify_setting", {
        setting_name_param: "shopify_orders_imported",
        setting_value_param: "0"
      });
      
      if (resetOrdersError) {
        debug(`Error resetting orders counter: ${resetOrdersError.message}`);
      } else {
        debug("Successfully reset orders counter to 0");
      }
      
      // Reset order lines imported counter
      const { error: resetLinesError } = await supabase.rpc("upsert_shopify_setting", {
        setting_name_param: "shopify_orders_lines_imported",
        setting_value_param: "0"
      });
      
      if (resetLinesError) {
        debug(`Error resetting order lines counter: ${resetLinesError.message}`);
      } else {
        debug("Successfully reset order lines counter to 0");
      }
      
      // Reset import status to ensure it's not stuck
      const { error: resetStatusError } = await supabase.rpc("upsert_shopify_setting", {
        setting_name_param: "shopify_import_status",
        setting_value_param: "idle"
      });
      
      if (resetStatusError) {
        debug(`Error resetting import status: ${resetStatusError.message}`);
      } else {
        debug("Successfully reset import status to idle");
      }
    } catch (resetError: any) {
      debug(`Error during counter reset: ${resetError.message}`);
      // Continue with the process even if counter reset fails
    }
    
    responseData.success = true;
    responseData.cleaned = true;
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("=== CLEANUP OPERATION FAILED ===");
    console.error(`Error message: ${error.message}`);
    
    if (error.stack) {
      console.error(`Stack trace: ${error.stack}`);
    }
    
    responseData.error = error.message;
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
