
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

// Interfaces for types
interface ContinuationToken {
  page: number;
  updatedCount: number;
  startTime: number;
  processingComplete: boolean;
  totalCount?: number;
}

interface FunctionParams {
  apiToken: string;
  continuationToken?: string;
}

// Handle CORS preflight requests
function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  return null;
}

// Shopify GraphQL query for locations
const SHOPIFY_LOCATIONS_QUERY = `
  query {
    locations(first: 10) {
      edges {
        node {
          id
          name
          isActive
        }
      }
    }
  }
`;

// Shopify GraphQL query for fulfillment orders
const FULFILLMENT_ORDERS_QUERY = `
  query getFulfillmentOrders($orderId: ID!) {
    order(id: $orderId) {
      id
      name
      fulfillmentOrders(first: 5) {
        edges {
          node {
            id
            assignedLocation {
              id
              name
            }
            lineItems(first: 20) {
              edges {
                node {
                  id
                  lineItem {
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

// Execute GraphQL query
async function executeShopifyGraphQL(token: string, query: string, variables: Record<string, any> = {}): Promise<any> {
  try {
    const response = await fetch('https://opus-harley-davidson.myshopify.com/admin/api/2023-07/graphql.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    const rateLimitHeader = response.headers.get('X-Shopify-Shop-Api-Call-Limit');
    console.log(`GraphQL API Rate Limit: ${rateLimitHeader || 'Not available'}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shopify GraphQL API error (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`GraphQL execution error:`, error);
    throw error;
  }
}

// Get a count estimate of items to process
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

// Extract Shopify GID from GraphQL ID
function extractIdFromGid(gid: string): string {
  // GIDs are like gid://shopify/Order/12345
  const parts = gid.split('/');
  return parts[parts.length - 1];
}

// Main function to process a batch of orders
async function processBatch(
  apiToken: string, 
  page: number, 
  pageSize: number,
  locations: Map<string, { id: string, name: string }>
): Promise<{ batchUpdates: number, hasMore: boolean }> {
  console.log(`Processing batch: page ${page}, size ${pageSize}`);
  
  // Fetch orders for this batch
  const { data: orders, error: ordersError } = await supabase
    .from("shopify_orders")
    .select("id, shopify_order_id")
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, (page * pageSize) - 1);
    
  if (ordersError) {
    console.error("Error fetching orders:", ordersError);
    throw new Error(`Failed to fetch orders: ${ordersError.message}`);
  }
  
  console.log(`Retrieved ${orders?.length || 0} orders from database`);
  
  if (!orders || orders.length === 0) {
    return { batchUpdates: 0, hasMore: false };
  }
  
  let batchUpdates = 0;
  const maxConcurrentRequests = 2; // Process only 2 orders at a time
  
  // Process orders in smaller chunks to respect rate limits
  for (let i = 0; i < orders.length; i += maxConcurrentRequests) {
    const orderBatch = orders.slice(i, i + maxConcurrentRequests);
    
    const results = await Promise.all(
      orderBatch.map(async (order) => {
        try {
          const shopifyOrderId = order.shopify_order_id;
          console.log(`Processing order ${shopifyOrderId}`);
          
          // Use GraphQL to get fulfillment orders with location data
          const fulfillmentData = await executeShopifyGraphQL(
            apiToken,
            FULFILLMENT_ORDERS_QUERY,
            { orderId: `gid://shopify/Order/${shopifyOrderId}` }
          );
          
          if (!fulfillmentData.data?.order?.fulfillmentOrders?.edges) {
            console.log(`No fulfillment orders found for order ${shopifyOrderId}`);
            return 0;
          }
          
          const fulfillmentOrders = fulfillmentData.data.order.fulfillmentOrders.edges;
          console.log(`Found ${fulfillmentOrders.length} fulfillment orders for order ${shopifyOrderId}`);
          
          // Get line items for this order from our database
          const { data: lineItems, error: lineItemsError } = await supabase
            .from("shopify_order_items")
            .select("id, shopify_line_item_id, location_id")
            .eq("order_id", order.id);
            
          if (lineItemsError) {
            console.error(`Error fetching line items for order ${order.id}:`, lineItemsError);
            return 0;
          }
          
          if (!lineItems || lineItems.length === 0) {
            console.log(`No line items found for order ${shopifyOrderId}`);
            return 0;
          }
          
          console.log(`Found ${lineItems.length} line items for order ${shopifyOrderId}`);
          
          // Map line items to locations from fulfillment orders
          const lineItemLocations = new Map();
          
          for (const foEdge of fulfillmentOrders) {
            const fulfillmentOrder = foEdge.node;
            if (!fulfillmentOrder.assignedLocation || !fulfillmentOrder.lineItems?.edges) {
              continue;
            }
            
            const locationId = extractIdFromGid(fulfillmentOrder.assignedLocation.id);
            const locationName = fulfillmentOrder.assignedLocation.name;
            
            for (const lineItemEdge of fulfillmentOrder.lineItems.edges) {
              const lineItemNode = lineItemEdge.node;
              if (!lineItemNode.lineItem?.id) continue;
              
              const lineItemId = extractIdFromGid(lineItemNode.lineItem.id);
              lineItemLocations.set(lineItemId, {
                locationId,
                locationName
              });
            }
          }
          
          // Prepare updates
          let orderUpdates = 0;
          const updatePromises = [];
          
          for (const item of lineItems) {
            const locationInfo = lineItemLocations.get(item.shopify_line_item_id);
            
            // Only update if location has changed
            if (locationInfo && locationInfo.locationId !== item.location_id) {
              updatePromises.push(
                supabase
                  .from("shopify_order_items")
                  .update({
                    location_id: locationInfo.locationId,
                    location_name: locationInfo.locationName
                  })
                  .eq("id", item.id)
              );
            }
          }
          
          if (updatePromises.length === 0) {
            console.log(`No location updates needed for order ${shopifyOrderId}`);
            return 0;
          }
          
          // Execute all updates
          const updateResults = await Promise.all(updatePromises);
          orderUpdates = updateResults.filter(result => !result.error).length;
          
          console.log(`Updated ${orderUpdates} line items for order ${shopifyOrderId}`);
          return orderUpdates;
        } catch (error) {
          console.error(`Error processing order ${order.shopify_order_id}:`, error);
          return 0;
        }
      })
    );
    
    // Sum up successful updates
    const chunkUpdates = results.reduce((sum, count) => sum + (count || 0), 0);
    batchUpdates += chunkUpdates;
    
    // Add a small delay between chunks to avoid rate limiting
    if (i + maxConcurrentRequests < orders.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  return { batchUpdates, hasMore: orders.length === pageSize };
}

// Main handler function
Deno.serve(async (req: Request) => {
  // Handle CORS preflight request
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const startTime = performance.now();
    console.log(`Request received at ${new Date().toISOString()}`);
    
    // Parse the request body
    let body: FunctionParams;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON in request body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const { apiToken, continuationToken: tokenString } = body;
    
    if (!apiToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'API token is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Parse continuation token
    let token: ContinuationToken;
    let totalEstimated: number | undefined;
    
    if (tokenString) {
      try {
        token = JSON.parse(tokenString);
        console.log("Resuming from continuation token:", token);
        
        if (token.totalCount) {
          totalEstimated = token.totalCount;
        }
      } catch (error) {
        console.error("Failed to parse continuation token:", error);
        token = { page: 1, updatedCount: 0, startTime: Date.now(), processingComplete: false };
      }
    } else {
      // Get an estimate of total items for progress tracking
      totalEstimated = await getApproximateTotalCount();
      token = {
        page: 1,
        updatedCount: 0,
        startTime: Date.now(),
        processingComplete: false,
        totalCount: totalEstimated
      };
      console.log("Starting new location sync process");
    }

    // Fetch all locations from Shopify using GraphQL
    console.log(`Fetching locations from Shopify GraphQL API`);
    const locationsData = await executeShopifyGraphQL(apiToken, SHOPIFY_LOCATIONS_QUERY);
    
    if (!locationsData.data?.locations?.edges) {
      throw new Error("Failed to fetch locations from Shopify");
    }
    
    // Create a map of location IDs to names
    const locationMap = new Map();
    const locationEdges = locationsData.data.locations.edges;
    
    for (const edge of locationEdges) {
      const location = edge.node;
      const locationId = extractIdFromGid(location.id);
      locationMap.set(locationId, {
        id: locationId,
        name: location.name
      });
    }
    
    console.log(`Retrieved ${locationMap.size} locations from Shopify`);
    
    // Process a batch of orders
    const pageSize = 25;
    const { batchUpdates, hasMore } = await processBatch(apiToken, token.page, pageSize, locationMap);
    
    // Update the continuation token
    token.updatedCount += batchUpdates;
    token.page += 1;
    token.processingComplete = !hasMore;
    
    const elapsedTime = (performance.now() - startTime) / 1000;
    console.log(`Batch ${token.page - 1} complete. Updated ${batchUpdates} items in this batch, ${token.updatedCount} total.`);
    console.log(`Processing ${token.processingComplete ? 'complete' : 'will continue with next batch'}`);
    console.log(`Elapsed time: ${elapsedTime.toFixed(2)}s`);
    
    // Return the response
    return new Response(
      JSON.stringify({
        success: true,
        message: token.processingComplete 
          ? "Location sync completed successfully" 
          : "Batch processed successfully. More batches remaining.",
        updated: token.updatedCount,
        continuationToken: JSON.stringify(token),
        processingComplete: token.processingComplete,
        timeElapsed: (Date.now() - token.startTime) / 1000,
        totalEstimated
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('Error in shopify-locations-sync-v2 function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unknown error occurred' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
