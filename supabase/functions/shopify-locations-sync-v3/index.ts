
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.6";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Response interface
interface ResponseData {
  success: boolean;
  error?: string;
  updated: number;
  totalProcessed: number;
  processingComplete: boolean;
  continuationToken?: string;
  rateLimitRemaining?: number;
  timeElapsed?: number;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Rate limiting helper - 1.5 seconds between requests
const minTimeBetweenRequests = 1500;
let lastRequestTime = 0;

async function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < minTimeBetweenRequests) {
    const waitTime = minTimeBetweenRequests - timeSinceLastRequest;
    console.log(`Rate limit: Waiting ${waitTime}ms before next request`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  lastRequestTime = Date.now();
}

interface ContinuationToken {
  lastProcessedId: string | null;
  batchSize: number;
  updatedCount: number;
  totalProcessed: number;
  startTime: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const { apiToken, continuationToken: continuationTokenStr } = await req.json();

    if (!apiToken) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'API token is required',
          updated: 0,
          totalProcessed: 0,
          processingComplete: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Parse continuation token if provided
    let continuationToken: ContinuationToken | null = null;
    if (continuationTokenStr) {
      try {
        continuationToken = JSON.parse(continuationTokenStr);
      } catch (e) {
        console.error("Failed to parse continuation token:", e);
      }
    }

    // Set default values
    const batchSize = continuationToken?.batchSize || 40;
    const lastProcessedId = continuationToken?.lastProcessedId || null;
    let updatedCount = continuationToken?.updatedCount || 0;
    let totalProcessed = continuationToken?.totalProcessed || 0;
    let startTimeFromToken = continuationToken?.startTime || startTime;

    // Get a batch of line items to update
    console.log(`Fetching batch of up to ${batchSize} line items. Last ID: ${lastProcessedId || 'N/A'}`);
    
    // Build query for line items without locations
    let query = supabase
      .from("shopify_order_items")
      .select(`
        id,
        shopify_line_item_id,
        order_id,
        shopify_orders!inner(shopify_order_id)
      `)
      .order('id', { ascending: true })
      .limit(batchSize)
      .is('location_id', null);

    if (lastProcessedId) {
      query = query.gt('id', lastProcessedId);
    }

    const { data: lineItems, error: lineItemsError } = await query;

    if (lineItemsError) {
      console.error("Error fetching line items:", lineItemsError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to retrieve line items: ${lineItemsError.message}`,
          updated: updatedCount,
          totalProcessed,
          processingComplete: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!lineItems || lineItems.length === 0) {
      console.log("No more line items to process");
      return new Response(
        JSON.stringify({ 
          success: true, 
          updated: updatedCount,
          totalProcessed,
          processingComplete: true,
          timeElapsed: (Date.now() - startTimeFromToken) / 1000
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Processing ${lineItems.length} line items`);
    await waitForRateLimit();

    // Prepare GraphQL query for batch of line items
    const shopifyAdminUrl = `https://opus-harley-davidson.myshopify.com/admin/api/2023-07/graphql.json`;
    const lineItemIds = lineItems.map(item => `gid://shopify/LineItem/${item.shopify_line_item_id}`);
    
    const graphqlQuery = `
      query GetLocationsForLineItems($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on LineItem {
            id
            variant {
              inventoryItem {
                inventoryLevels(first: 5) {
                  edges {
                    node {
                      location {
                        id
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch(shopifyAdminUrl, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': apiToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: {
          ids: lineItemIds
        },
      }),
    });

    // Record rate limit information
    const rateLimitRemaining = response.headers.get('X-Shopify-Shop-Api-Call-Limit');

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error from Shopify API:`, errorText);
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    
    if (responseData.errors) {
      console.error(`GraphQL errors:`, responseData.errors);
      throw new Error(`GraphQL errors: ${responseData.errors[0].message}`);
    }

    // Process locations from response
    const locationUpdates = [];
    const processedLineItems = new Set();

    if (responseData.data?.nodes) {
      for (const node of responseData.data.nodes) {
        if (!node) continue;

        const lineItemId = node.id.replace('gid://shopify/LineItem/', '');
        
        // Get inventory location
        let location = null;
        const inventoryLevels = node.variant?.inventoryItem?.inventoryLevels?.edges || [];
        if (inventoryLevels.length > 0) {
          location = inventoryLevels[0].node.location;
        }
        
        if (location) {
          const locationId = location.id.replace('gid://shopify/Location/', '');
          locationUpdates.push({
            lineItemId,
            locationId,
            locationName: location.name
          });
        }
        
        processedLineItems.add(lineItemId);
      }
    }

    // Update line items in database
    let batchUpdated = 0;
    for (const update of locationUpdates) {
      const lineItem = lineItems.find(item => 
        item.shopify_line_item_id === update.lineItemId
      );

      if (lineItem) {
        const { error: updateError } = await supabase
          .from("shopify_order_items")
          .update({
            location_id: update.locationId,
            location_name: update.locationName
          })
          .eq("id", lineItem.id);

        if (updateError) {
          console.error(`Error updating line item ${lineItem.id}:`, updateError);
        } else {
          batchUpdated++;
        }
      }
    }

    // Update progress information
    updatedCount += batchUpdated;
    totalProcessed += lineItems.length;
    const lastProcessedItemId = lineItems[lineItems.length - 1].id;

    // Prepare continuation token for next batch
    const newContinuationToken: ContinuationToken = {
      lastProcessedId: lastProcessedItemId,
      batchSize,
      updatedCount,
      totalProcessed,
      startTime: startTimeFromToken
    };

    console.log(`Batch complete. Updated: ${batchUpdated}, Total updated: ${updatedCount}, Total processed: ${totalProcessed}`);

    return new Response(
      JSON.stringify({
        success: true,
        updated: updatedCount,
        totalProcessed,
        processingComplete: false,
        continuationToken: JSON.stringify(newContinuationToken),
        rateLimitRemaining,
        timeElapsed: (Date.now() - startTimeFromToken) / 1000
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error("Error in shopify-locations-sync-v3:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unknown error occurred",
        updated: 0,
        totalProcessed: 0,
        processingComplete: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
