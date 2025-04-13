import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { corsHeaders, SyncResponse } from "../shopify-sync-all/types.ts";
import { handleCorsPreflightRequest } from "../shopify-sync-all/corsUtils.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.6";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface CompleteRefreshRequestBody {
  apiToken?: string;
  filters?: {
    status?: string;
    fulfillment_status?: string;
    [key: string]: string | undefined;
  };
}

serve(async (req) => {
  console.log("=== Shopify Complete Refresh Function Started ===");
  console.log(`Request method: ${req.method}`);
  
  // Handle CORS preflight requests
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  // Initialize response data
  const responseData: SyncResponse & { 
    cleaned?: boolean,
    syncStarted?: boolean,
    syncComplete?: boolean 
  } = {
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
    let body: CompleteRefreshRequestBody = {};
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
    
    debug("Starting complete refresh operation (cleanup + import)");
    
    // STEP 1: First call the cleanup function
    debug("STEP 1: Calling database cleanup function...");
    const cleanupResponse = await supabase.functions.invoke('shopify-database-cleanup', {
      body: { 
        apiToken: apiToken
      }
    });
    
    if (cleanupResponse.error) {
      debug(`Error invoking cleanup function: ${cleanupResponse.error.message || 'Unknown error'}`);
      throw new Error(`Cleanup operation failed: ${cleanupResponse.error.message || 'Unknown error'}`);
    }
    
    const cleanupData = cleanupResponse.data as any;
    
    // Check if the cleanup was successful
    if (!cleanupData.success) {
      debug(`Cleanup operation returned success=false: ${cleanupData.error || 'No error message provided'}`);
      throw new Error(`Cleanup operation failed: ${cleanupData.error || 'Unknown error'}`);
    }
    
    debug("Database cleanup completed successfully");
    responseData.cleaned = true;
    
    // STEP 2: Now call the import function
    debug("STEP 2: Calling import function...");
    // Use a timeout to implement a 30-second limit for the import function
    let importTimedOut = false;
    const importPromise = supabase.functions.invoke('shopify-sync-all', {
      body: { 
        apiToken: apiToken,
        operation: "import",
        filters: filters
      }
    });
    
    // Set a timeout promise that will complete after 60 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        importTimedOut = true;
        reject(new Error("Import operation timed out after 60 seconds"));
      }, 60000);
    });
    
    try {
      // Use Promise.race to limit the import function's time
      const importResponse = await Promise.race([importPromise, timeoutPromise]) as any;
      
      if (importResponse.error) {
        debug(`Error invoking import function: ${importResponse.error.message || 'Unknown error'}`);
        throw new Error(`Import operation failed: ${importResponse.error.message || 'Unknown error'}`);
      }
      
      const importData = importResponse.data as any;
      
      // Check if the import was successful
      if (!importData.success) {
        debug(`Import operation returned success=false: ${importData.error || 'No error message provided'}`);
        throw new Error(`Import operation failed: ${importData.error || 'Unknown error'}`);
      }
      
      debug(`Import completed successfully with ${importData.imported || 0} orders imported`);
      responseData.imported = importData.imported || 0;
      responseData.syncComplete = true;
    } catch (importError) {
      // If the import timed out, it's likely still running in the background
      if (importTimedOut) {
        debug("Import operation timed out but may still be running in the background");
        responseData.syncStarted = true;
        responseData.syncComplete = false;
        
        // Update the last sync time with a background operation indicator
        await supabase.rpc("upsert_shopify_setting", {
          setting_name_param: "shopify_import_status",
          setting_value_param: "background"
        });
      } else {
        // Otherwise, it's a real error
        debug(`Error during import: ${importError.message}`);
        throw importError;
      }
    }
    
    // STEP 3: Update last sync time
    debug("STEP 3: Updating last sync time...");
    const { error: updateError } = await supabase.rpc("upsert_shopify_setting", {
      setting_name_param: "last_sync_time",
      setting_value_param: new Date().toISOString()
    });

    if (updateError) {
      debug(`Failed to update last sync time: ${updateError.message}`);
    } else {
      debug("Successfully updated last sync time");
    }
    
    responseData.success = true;
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    debug(`Error in complete refresh operation: ${error.message}`);
    responseData.error = error.message;
    
    // Make sure status is set to error in database
    await supabase.rpc("upsert_shopify_setting", {
      setting_name_param: "shopify_import_status",
      setting_value_param: "error"
    });
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
