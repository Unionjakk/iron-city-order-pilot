
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

// Rate limiting helper
let lastRequestTime = 0;
const minTimeBetweenRequests = 1500; // 1.5 seconds between requests

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

// Continuation token interface
interface ContinuationToken {
  lastProcessedId: string | null;
  batchSize: number;
  updatedCount: number;
  totalProcessed: number;
  startTime: number;
}

// Handler for the edge function
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    
    // Parse request body
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
    
    // Build query based on whether we have a lastProcessedId
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

    // Only add the gt condition if we have a lastProcessedId
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

    // If no more items to process, we're done
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
    
    // Group line items by order
    const lineItemsByOrder: Record<string, any[]> = {};
    for (const item of lineItems) {
      const orderId = item.shopify_orders.shopify_order_id;
      if (!lineItemsByOrder[orderId]) {
        lineItemsByOrder[orderId] = [];
      }
      lineItemsByOrder[orderId].push(item);
    }
    
    // For each order, fetch location data and update line items
    let batchUpdated = 0;
    const orderIds = Object.keys(lineItemsByOrder);
    console.log(`Processing ${orderIds.length} orders`);
    
    for (const orderId of orderIds) {
      console.log(`Processing order ${orderId}`);
      await waitForRateLimit();
      
      try {
        // Fetch location data for this order using the GraphQL API
        const shopifyAdminUrl = `https://opus-harley-davidson.myshopify.com/admin/api/2023-07/graphql.json`;
        
        // Fixed GraphQL query based on the error messages
        const query = `
          query GetOrderWithLocations($id: ID!) {
            order(id: $id) {
              id
              lineItems(first: 100) {
                edges {
                  node {
                    id
                    variant {
                      inventoryItem {
                        # Get inventory item locations without using the inventoryLevel field that requires locationId
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
              fulfillmentOrders(first: 10) {
                edges {
                  node {
                    # Fix for accessing line items in fulfillment orders
                    lineItems(first: 100) {
                      edges {
                        node {
                          lineItem {
                            id
                          }
                        }
                      }
                    }
                    assignedLocation {
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
        `;
        
        const response = await fetch(shopifyAdminUrl, {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': apiToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            variables: {
              id: `gid://shopify/Order/${orderId}`,
            },
          }),
        });
        
        // Record rate limit information
        const rateLimitRemaining = response.headers.get('X-Shopify-Shop-Api-Call-Limit');
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error fetching order ${orderId}:`, errorText);
          continue;
        }
        
        const responseData = await response.json();
        
        if (responseData.errors && responseData.errors.length > 0) {
          console.error(`GraphQL errors for order ${orderId}:`, responseData.errors);
          continue;
        }
        
        if (!responseData.data || !responseData.data.order) {
          console.error(`No data returned for order ${orderId}`);
          continue;
        }
        
        // Process the response to extract location information
        const orderData = responseData.data.order;
        
        // First build a map from fulfillment orders
        const locationByLineItem: Record<string, { id: string, name: string }> = {};
        
        // Check fulfillment orders for assigned locations
        if (orderData.fulfillmentOrders && orderData.fulfillmentOrders.edges) {
          for (const edge of orderData.fulfillmentOrders.edges) {
            const fulfillmentOrder = edge.node;
            
            if (fulfillmentOrder.assignedLocation && fulfillmentOrder.assignedLocation.location) {
              const location = fulfillmentOrder.assignedLocation.location;
              const locationId = location.id.replace('gid://shopify/Location/', '');
              
              // Updated to use proper structure for accessing line items in fulfillment orders
              if (fulfillmentOrder.lineItems && fulfillmentOrder.lineItems.edges) {
                for (const lineItemEdge of fulfillmentOrder.lineItems.edges) {
                  if (lineItemEdge.node && lineItemEdge.node.lineItem) {
                    const lineItemId = lineItemEdge.node.lineItem.id.replace('gid://shopify/LineItem/', '');
                    locationByLineItem[lineItemId] = {
                      id: locationId,
                      name: location.name
                    };
                  }
                }
              }
            }
          }
        }
        
        // Then check inventory levels for line items
        if (orderData.lineItems && orderData.lineItems.edges) {
          for (const edge of orderData.lineItems.edges) {
            const lineItem = edge.node;
            const lineItemId = lineItem.id.replace('gid://shopify/LineItem/', '');
            
            // Skip if already have location from fulfillment orders
            if (locationByLineItem[lineItemId]) {
              continue;
            }
            
            if (lineItem.variant && lineItem.variant.inventoryItem) {
              const inventoryItem = lineItem.variant.inventoryItem;
              
              // Updated to use inventoryLevels instead of inventoryLevel
              if (inventoryItem.inventoryLevels && 
                  inventoryItem.inventoryLevels.edges && 
                  inventoryItem.inventoryLevels.edges.length > 0) {
                const inventoryLevel = inventoryItem.inventoryLevels.edges[0].node;
                
                if (inventoryLevel.location) {
                  const location = inventoryLevel.location;
                  const locationId = location.id.replace('gid://shopify/Location/', '');
                  
                  locationByLineItem[lineItemId] = {
                    id: locationId,
                    name: location.name
                  };
                }
              }
            }
          }
        }
        
        // Update line items for this order
        const orderLineItems = lineItemsByOrder[orderId];
        const updates = [];
        
        for (const item of orderLineItems) {
          const location = locationByLineItem[item.shopify_line_item_id];
          
          updates.push({
            id: item.id,
            location_id: location ? location.id : null,
            location_name: location ? location.name : null
          });
        }
        
        if (updates.length > 0) {
          // Update line items in database
          for (const update of updates) {
            const { error: updateError } = await supabase
              .from("shopify_order_items")
              .update({
                location_id: update.location_id,
                location_name: update.location_name
              })
              .eq("id", update.id);
            
            if (updateError) {
              console.error(`Error updating line item ${update.id}:`, updateError);
            } else {
              batchUpdated++;
            }
          }
        }
      } catch (error) {
        console.error(`Error processing order ${orderId}:`, error);
      }
    }
    
    // Update progress information
    updatedCount += batchUpdated;
    totalProcessed += lineItems.length;
    lastProcessedId = lineItems[lineItems.length - 1].id;
    
    // Prepare continuation token for next batch
    const newContinuationToken: ContinuationToken = {
      lastProcessedId,
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
        totalProcessed: totalProcessed,
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
