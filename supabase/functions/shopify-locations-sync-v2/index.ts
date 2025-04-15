
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
  created_at?: string;
  updated_at?: string;
  active?: boolean;
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

// Progress information to resume from where we left off
interface ContinuationToken {
  lastProcessedOrderId?: string;
  page?: number;
  updatedCount: number;
  startTime: number;
  batchNumber: number;
  processingComplete: boolean;
}

// Handler for the edge function
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiToken, continuationToken: continuationTokenStr } = await req.json() as FunctionParams;
    
    if (!apiToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'API token is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Parse the continuation token if it exists
    let continuationToken: ContinuationToken | undefined;
    if (continuationTokenStr) {
      try {
        continuationToken = JSON.parse(continuationTokenStr);
        console.log("Resuming from continuation token:", continuationToken);
      } catch (error) {
        console.error("Failed to parse continuation token:", error);
      }
    }

    // If no continuation token or new run, initialize it
    if (!continuationToken) {
      continuationToken = {
        updatedCount: 0,
        startTime: Date.now(),
        batchNumber: 1,
        processingComplete: false
      };
      console.log("Starting new location sync process");
    }

    // Shopify's REST API URL for locations
    const locationsUrl = "https://opus-harley-davidson.myshopify.com/admin/api/2023-07/locations.json";
    console.log(`Fetching locations from: ${locationsUrl}`);
    
    // Fetch all locations from Shopify
    const response = await fetch(locationsUrl, {
      headers: {
        "X-Shopify-Access-Token": apiToken,
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Shopify API error: ${response.status} ${response.statusText}`, error);
      throw new Error(`Shopify API returned error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as ShopifyLocationsResponse;
    
    if (!data.locations || !Array.isArray(data.locations)) {
      console.error("Unexpected Shopify API response format:", data);
      throw new Error("Received unexpected data format from Shopify API");
    }

    console.log(`Retrieved ${data.locations.length} locations from Shopify`);
    
    // Create a map of location IDs to names for easy lookup
    const locationMap = new Map<string, string>();
    for (const location of data.locations) {
      locationMap.set(String(location.id), location.name);
    }

    console.log("Created location map with entries:", locationMap.size);
    
    // Determine which orders to process
    const batchSize = 50; // Process 50 orders at a time
    
    const { data: orders, error: ordersError } = await supabase
      .from("shopify_orders")
      .select("id, shopify_order_id")
      .order("created_at", { ascending: false })
      .range(
        (continuationToken.batchNumber - 1) * batchSize, 
        continuationToken.batchNumber * batchSize - 1
      );
      
    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    console.log(`Processing batch ${continuationToken.batchNumber} with ${orders.length} orders`);
    
    if (orders.length === 0) {
      // We've processed all orders
      continuationToken.processingComplete = true;
      console.log("No more orders to process. Job complete.");
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Location sync completed successfully",
          updated: continuationToken.updatedCount,
          continuationToken: JSON.stringify(continuationToken),
          processingComplete: true,
          timeElapsed: (Date.now() - continuationToken.startTime) / 1000
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // For each order, fetch its line items
    let totalUpdated = continuationToken.updatedCount;
    
    for (const order of orders) {
      console.log(`Processing order ${order.shopify_order_id}`);
      
      // Fetch line items for this order
      const { data: lineItems, error: lineItemsError } = await supabase
        .from("shopify_order_items")
        .select("id, shopify_line_item_id, location_id, title")
        .eq("order_id", order.id);
        
      if (lineItemsError) {
        console.error(`Error fetching line items for order ${order.id}:`, lineItemsError);
        continue;
      }
      
      // Skip if no line items
      if (!lineItems || lineItems.length === 0) {
        console.log(`No line items found for order ${order.shopify_order_id}`);
        continue;
      }

      console.log(`Found ${lineItems.length} line items for order ${order.shopify_order_id}`);
      
      // We'll now fetch the order's fulfillment orders from Shopify
      // This gives us the location_id for each line item
      const fulfillmentOrdersUrl = `https://opus-harley-davidson.myshopify.com/admin/api/2023-07/orders/${order.shopify_order_id}/fulfillment_orders.json`;
      console.log(`Fetching fulfillment orders from: ${fulfillmentOrdersUrl}`);
      
      try {
        const fulfillmentResponse = await fetch(fulfillmentOrdersUrl, {
          headers: {
            "X-Shopify-Access-Token": apiToken,
            "Content-Type": "application/json",
          },
        });
        
        if (!fulfillmentResponse.ok) {
          console.error(`Shopify API error for fulfillment orders: ${fulfillmentResponse.status}`);
          continue;
        }
        
        const fulfillmentData = await fulfillmentResponse.json();
        
        if (!fulfillmentData.fulfillment_orders || !Array.isArray(fulfillmentData.fulfillment_orders)) {
          console.error("Unexpected format for fulfillment orders:", fulfillmentData);
          continue;
        }
        
        // Process each fulfillment order to extract line item locations
        for (const fulfillmentOrder of fulfillmentData.fulfillment_orders) {
          if (!fulfillmentOrder.line_items || !Array.isArray(fulfillmentOrder.line_items)) {
            continue;
          }
          
          const locationId = String(fulfillmentOrder.assigned_location_id);
          const locationName = locationMap.get(locationId) || null;
          
          // Map Shopify line items to our database line items
          for (const fulfillmentLineItem of fulfillmentOrder.line_items) {
            const lineItemId = String(fulfillmentLineItem.line_item_id);
            
            // Find matching line item in our database
            const matchingLineItem = lineItems.find(item => 
              item.shopify_line_item_id === lineItemId
            );
            
            if (matchingLineItem) {
              // Only update if location info is different or missing
              if (matchingLineItem.location_id !== locationId) {
                console.log(`Updating line item ${matchingLineItem.id} with location ${locationId} (${locationName})`);
                
                const { error: updateError } = await supabase
                  .from("shopify_order_items")
                  .update({
                    location_id: locationId,
                    location_name: locationName
                  })
                  .eq("id", matchingLineItem.id);
                  
                if (updateError) {
                  console.error(`Error updating line item ${matchingLineItem.id}:`, updateError);
                } else {
                  totalUpdated++;
                }
              } else {
                console.log(`Line item ${matchingLineItem.id} already has correct location ${locationId}`);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error processing fulfillment orders for order ${order.shopify_order_id}:`, error);
        continue;
      }
    }
    
    // Update the continuation token for the next run
    continuationToken.updatedCount = totalUpdated;
    continuationToken.batchNumber += 1;

    // If we processed less than the batch size, we're done
    const processingComplete = orders.length < batchSize;
    continuationToken.processingComplete = processingComplete;
    
    console.log(`Batch ${continuationToken.batchNumber - 1} complete. Updated ${totalUpdated} line items.`);
    console.log(`Processing ${processingComplete ? 'complete' : 'will continue with next batch'}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: processingComplete 
          ? "Location sync completed successfully" 
          : "Batch processed successfully. More batches remaining.",
        updated: totalUpdated,
        continuationToken: JSON.stringify(continuationToken),
        processingComplete,
        timeElapsed: (Date.now() - continuationToken.startTime) / 1000
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
