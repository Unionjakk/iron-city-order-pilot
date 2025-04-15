
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Represents a Shopify location
interface ShopifyLocation {
  id: number;
  name: string;
  address1?: string;
  address2?: string;
  city?: string;
  zip?: string;
  province?: string;
  country?: string;
  phone?: string;
}

// Interface for continuation token
interface ContinuationToken {
  lastProcessedOrderId?: string;
  batchNumber: number;
  updatedCount: number;
  startTime: number;
  processingComplete: boolean;
  lastPage?: string;
  totalCount?: number;
}

// Response from Shopify Locations API
interface ShopifyLocationsResponse {
  locations: ShopifyLocation[];
}

// Input parameters for the function
interface FunctionParams {
  apiToken: string;
  continuationToken?: string;
}

// Handle CORS preflight requests
const corsHandler = (req: Request): Response | null => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  return null;
};

// Returns the total count of line items needing updates
async function getApproximateTotalCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("shopify_order_items")
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error("Error counting items:", error);
      return 1000; // Default estimate
    }
    
    return count || 1000;
  } catch (error) {
    console.error("Error estimating total items:", error);
    return 1000; // Default fallback
  }
}

// Main handler function
Deno.serve(async (req: Request) => {
  // Handle CORS preflight request
  const corsResponse = corsHandler(req);
  if (corsResponse) return corsResponse;

  try {
    const startTime = performance.now();
    console.log(`Request received at ${new Date().toISOString()}`);
    
    const { apiToken, continuationToken: continuationTokenStr } = await req.json() as FunctionParams;
    
    if (!apiToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'API token is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Parse the continuation token if it exists
    let continuationToken: ContinuationToken | undefined;
    let totalEstimated: number | undefined;
    
    if (continuationTokenStr) {
      try {
        continuationToken = JSON.parse(continuationTokenStr);
        console.log("Resuming from continuation token:", continuationToken);
        
        if (continuationToken.totalCount) {
          totalEstimated = continuationToken.totalCount;
        }
      } catch (error) {
        console.error("Failed to parse continuation token:", error);
      }
    }

    // If no continuation token or new run, initialize it
    if (!continuationToken) {
      // Get an estimate of total items to process for progress tracking
      totalEstimated = await getApproximateTotalCount();
      
      continuationToken = {
        batchNumber: 1,
        updatedCount: 0,
        startTime: Date.now(),
        processingComplete: false,
        totalCount: totalEstimated
      };
      console.log("Starting new location sync process");
    }

    // Create a cache for location information to reduce API calls
    const locationCache = new Map<string, { id: string, name: string }>();
    let rateLimitRemaining: number | null = null;

    // Fetch all locations from Shopify (once per batch to ensure we have updated data)
    console.log(`Fetching locations from Shopify API`);
    
    const locationsUrl = "https://opus-harley-davidson.myshopify.com/admin/api/2023-07/locations.json";
    console.log(`Fetching locations from: ${locationsUrl}`);
    
    const locationsResponse = await fetch(locationsUrl, {
      headers: {
        "X-Shopify-Access-Token": apiToken,
        "Content-Type": "application/json",
      },
    });
    
    // Track rate limits
    rateLimitRemaining = Number(locationsResponse.headers.get("X-Shopify-Shop-Api-Call-Limit")?.split('/')[0]) || null;
    console.log(`API Rate Limit: ${locationsResponse.headers.get("X-Shopify-Shop-Api-Call-Limit")}`);
    
    if (!locationsResponse.ok) {
      const errorText = await locationsResponse.text();
      console.error(`Shopify API error: ${locationsResponse.status} ${locationsResponse.statusText}`, errorText);
      
      if (locationsResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Rate limit exceeded. Please try again later.",
            continuationToken: JSON.stringify(continuationToken),
            updated: continuationToken.updatedCount,
            timeElapsed: (Date.now() - continuationToken.startTime) / 1000,
            processingComplete: false,
            rateLimitRemaining
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Shopify API error: ${locationsResponse.status} ${errorText}`);
    }
    
    const locationsData = await locationsResponse.json() as ShopifyLocationsResponse;
    
    if (!locationsData.locations || !Array.isArray(locationsData.locations)) {
      console.error("Unexpected Shopify API response format:", locationsData);
      throw new Error("Received unexpected data format from Shopify API");
    }

    console.log(`Retrieved ${locationsData.locations.length} locations from Shopify`);
    
    // Create a map of location IDs to names for easy lookup
    for (const location of locationsData.locations) {
      locationCache.set(String(location.id), {
        id: String(location.id),
        name: location.name
      });
    }

    // Determine which orders to process
    const batchSize = 25; // Reduce batch size to avoid rate limits
    const batchNumber = continuationToken.batchNumber;
    
    console.log(`Processing batch ${batchNumber} with size ${batchSize}`);
    
    const { data: orders, error: ordersError } = await supabase
      .from("shopify_orders")
      .select("id, shopify_order_id")
      .order("created_at", { ascending: false })
      .range(
        (batchNumber - 1) * batchSize,
        (batchNumber * batchSize) - 1
      );
      
    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }
    
    console.log(`Retrieved ${orders?.length || 0} orders from database`);
    
    if (!orders || orders.length === 0) {
      // We've processed all orders
      console.log("No more orders to process. Job complete.");
      
      continuationToken.processingComplete = true;
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Location sync completed successfully",
          updated: continuationToken.updatedCount,
          continuationToken: JSON.stringify(continuationToken),
          processingComplete: true,
          timeElapsed: (Date.now() - continuationToken.startTime) / 1000,
          rateLimitRemaining,
          totalEstimated
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Track total updated items
    let totalUpdated = continuationToken.updatedCount;
    let updatedInThisBatch = 0;
    
    // Process orders with controlled concurrency to avoid rate limits
    const concurrencyLimit = 2; // Process only 2 orders at a time to respect rate limits
    
    for (let i = 0; i < orders.length; i += concurrencyLimit) {
      const batchSlice = orders.slice(i, i + concurrencyLimit);
      console.log(`Processing mini-batch ${i/concurrencyLimit + 1} of ${Math.ceil(orders.length/concurrencyLimit)}`);
      
      // Process this mini-batch of orders concurrently
      const results = await Promise.all(
        batchSlice.map(async (order) => {
          try {
            console.log(`Processing order ${order.shopify_order_id}`);
            
            // Fetch fulfillment orders for this order
            const fulfillmentOrdersUrl = `https://opus-harley-davidson.myshopify.com/admin/api/2023-07/orders/${order.shopify_order_id}/fulfillment_orders.json`;
            
            const fulfillmentResponse = await fetch(fulfillmentOrdersUrl, {
              headers: {
                "X-Shopify-Access-Token": apiToken,
                "Content-Type": "application/json",
              },
            });
            
            // Update rate limit tracking
            const rateLimit = fulfillmentResponse.headers.get("X-Shopify-Shop-Api-Call-Limit");
            if (rateLimit) {
              const parts = rateLimit.split('/');
              rateLimitRemaining = Number(parts[0]);
              console.log(`API Rate Limit after order ${order.shopify_order_id}: ${rateLimit}`);
            }
            
            if (!fulfillmentResponse.ok) {
              console.error(`Error fetching fulfillment orders for ${order.shopify_order_id}: ${fulfillmentResponse.status}`);
              
              // If rate limited, we'll stop processing and return current status
              if (fulfillmentResponse.status === 429) {
                throw new Error("RATE_LIMIT_EXCEEDED");
              }
              
              return 0; // Skip this order but continue with others
            }
            
            const fulfillmentData = await fulfillmentResponse.json();
            
            if (!fulfillmentData.fulfillment_orders || !Array.isArray(fulfillmentData.fulfillment_orders)) {
              console.error("Unexpected format for fulfillment orders:", fulfillmentData);
              return 0;
            }
            
            console.log(`Found ${fulfillmentData.fulfillment_orders.length} fulfillment orders for order ${order.shopify_order_id}`);
            
            // Get line items for this order
            const { data: lineItems, error: lineItemsError } = await supabase
              .from("shopify_order_items")
              .select("id, shopify_line_item_id, location_id")
              .eq("order_id", order.id);
              
            if (lineItemsError) {
              console.error(`Error fetching line items for order ${order.id}:`, lineItemsError);
              return 0;
            }
            
            if (!lineItems || lineItems.length === 0) {
              console.log(`No line items found for order ${order.shopify_order_id}`);
              return 0;
            }
            
            console.log(`Found ${lineItems.length} line items for order ${order.shopify_order_id}`);
            
            // Build a mapping of line item IDs to location IDs
            const lineItemLocations = new Map<string, { locationId: string, locationName: string | null }>();
            
            for (const fulfillmentOrder of fulfillmentData.fulfillment_orders) {
              if (!fulfillmentOrder.line_items || !Array.isArray(fulfillmentOrder.line_items)) {
                continue;
              }
              
              const locationId = String(fulfillmentOrder.assigned_location_id);
              if (!locationId) {
                continue;
              }
              
              // Get location name from cache
              let locationName = null;
              const cachedLocation = locationCache.get(locationId);
              if (cachedLocation) {
                locationName = cachedLocation.name;
              }
              
              for (const item of fulfillmentOrder.line_items) {
                lineItemLocations.set(String(item.line_item_id), {
                  locationId,
                  locationName
                });
              }
            }
            
            // Process updates in small batches
            let orderUpdatedCount = 0;
            const updateBatchSize = 20;
            
            for (let j = 0; j < lineItems.length; j += updateBatchSize) {
              const updateBatch = lineItems.slice(j, j + updateBatchSize);
              
              const updates = updateBatch
                .filter(item => {
                  const locationInfo = lineItemLocations.get(item.shopify_line_item_id);
                  return locationInfo && locationInfo.locationId !== item.location_id;
                })
                .map(item => {
                  const locationInfo = lineItemLocations.get(item.shopify_line_item_id);
                  return {
                    id: item.id,
                    location_id: locationInfo?.locationId,
                    location_name: locationInfo?.locationName
                  };
                });
              
              if (updates.length === 0) {
                console.log(`No updates needed for batch ${j/updateBatchSize + 1} of order ${order.shopify_order_id}`);
                continue;
              }
              
              console.log(`Updating ${updates.length} items for order ${order.shopify_order_id}`);
              
              // Perform updates in parallel
              const updateResults = await Promise.all(
                updates.map(update =>
                  supabase
                    .from("shopify_order_items")
                    .update({
                      location_id: update.location_id,
                      location_name: update.location_name
                    })
                    .eq("id", update.id)
                )
              );
              
              // Count successful updates
              const successfulUpdates = updateResults.filter(result => !result.error).length;
              orderUpdatedCount += successfulUpdates;
              
              console.log(`Successfully updated ${successfulUpdates}/${updates.length} items for batch ${j/updateBatchSize + 1}`);
            }
            
            console.log(`Updated ${orderUpdatedCount} line items for order ${order.shopify_order_id}`);
            return orderUpdatedCount;
          } catch (error: any) {
            if (error.message === "RATE_LIMIT_EXCEEDED") {
              throw error; // Propagate rate limit errors to stop processing
            }
            console.error(`Error processing order ${order.shopify_order_id}:`, error);
            return 0;
          }
        })
      ).catch(error => {
        // If we hit a rate limit, we want to stop processing and return current status
        if (error.message === "RATE_LIMIT_EXCEEDED") {
          throw error;
        }
        return [];
      });
      
      // Check if we hit a rate limit
      if (!Array.isArray(results)) {
        throw new Error("RATE_LIMIT_EXCEEDED");
      }
      
      // Count successful updates in this batch
      const batchUpdates = results.reduce((sum, count) => sum + count, 0);
      updatedInThisBatch += batchUpdates;
      
      // Check if we're getting close to rate limits
      if (rateLimitRemaining !== null && rateLimitRemaining < 5) {
        console.log(`Rate limit getting low (${rateLimitRemaining}), pausing processing`);
        break; // Stop processing this batch and return current progress
      }
    }
    
    // Update total count
    totalUpdated += updatedInThisBatch;
    
    // Update the continuation token
    continuationToken.updatedCount = totalUpdated;
    continuationToken.batchNumber += 1;
    
    // If we processed less than the batch size, we're likely done
    const processingComplete = orders.length < batchSize;
    continuationToken.processingComplete = processingComplete;
    
    const elapsedTimeMs = performance.now() - startTime;
    console.log(`Batch ${batchNumber} complete. Updated ${updatedInThisBatch} items in this batch, ${totalUpdated} total.`);
    console.log(`Processing ${processingComplete ? 'complete' : 'will continue with next batch'}`);
    console.log(`Elapsed time: ${(elapsedTimeMs/1000).toFixed(2)}s`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: processingComplete 
          ? "Location sync completed successfully" 
          : "Batch processed successfully. More batches remaining.",
        updated: totalUpdated,
        continuationToken: JSON.stringify(continuationToken),
        processingComplete,
        timeElapsed: (Date.now() - continuationToken.startTime) / 1000,
        rateLimitRemaining,
        totalEstimated
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('Error in shopify-locations-sync-v2 function:', error);
    
    // If rate limited, return a continuation token so the client can retry
    if (error.message === "RATE_LIMIT_EXCEEDED") {
      const token = {
        batchNumber: error.continuationToken?.batchNumber || 1,
        updatedCount: error.continuationToken?.updatedCount || 0,
        startTime: error.continuationToken?.startTime || Date.now(),
        processingComplete: false
      };
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Rate limit exceeded. Please try again in a few minutes.",
          continuationToken: JSON.stringify(token),
          updated: token.updatedCount,
          timeElapsed: (Date.now() - token.startTime) / 1000,
          processingComplete: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unknown error occurred' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
