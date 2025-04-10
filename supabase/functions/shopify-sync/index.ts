
// IMPORTANT: This Edge Function interacts with a PRODUCTION Shopify API
// Any changes must maintain compatibility with the live system

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Supabase client setup
const supabaseUrl = "https://hbmismnzmocjazaiicdu.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// The special value 'placeholder_token' represents no token being set
const PLACEHOLDER_TOKEN_VALUE = 'placeholder_token';

// Function to get API token from database
async function getApiTokenFromDatabase() {
  try {
    const { data, error } = await supabase
      .rpc('get_shopify_setting', { setting_name_param: 'shopify_token' });
    
    if (error) {
      console.error('Error retrieving token from database:', error);
      return null;
    }
    
    // Check if we have a valid token (not the placeholder)
    if (data && typeof data === 'string' && data !== PLACEHOLDER_TOKEN_VALUE) {
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('Exception retrieving token:', error);
    return null;
  }
}

// Function to format the date for Shopify API
const formatDate = (date: Date): string => {
  return date.toISOString();
};

// Function to fetch orders from Shopify with pagination to get all orders
async function fetchShopifyOrders(apiToken: string): Promise<any> {
  const shopifyDomain = "opus-harley-davidson.myshopify.com";
  const apiVersion = "2023-07";
  
  // We'll collect all orders here
  let allOrders = [];
  // Keep track of the next page URL
  let nextPageUrl = null;
  // Start with the first page
  let currentUrl = `https://${shopifyDomain}/admin/api/${apiVersion}/orders.json`;
  
  // Parameters to filter for unfulfilled orders and limit fields
  const params = new URLSearchParams({
    status: "unfulfilled",
    fields: "id,order_number,created_at,customer,line_items,shipping_address,note,fulfillment_status,location_id",
  });
  // Note: Removed the limit parameter to fetch all orders

  console.log(`Starting to fetch all unfulfilled orders from Shopify`);
  
  // Loop until we have no more pages
  do {
    // Determine which URL to use - either the current page or next page
    let fetchUrl = nextPageUrl || `${currentUrl}?${params}`;
    
    console.log(`Fetching orders page from Shopify: ${fetchUrl}`);
    
    try {
      const response = await fetch(fetchUrl, {
        method: "GET",
        headers: {
          "X-Shopify-Access-Token": apiToken,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Shopify API error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const pageOrders = data.orders || [];
      
      console.log(`Fetched ${pageOrders.length} unfulfilled orders from page`);
      
      // Add this page's orders to our collection
      allOrders = allOrders.concat(pageOrders);
      
      // Check for Link header which contains pagination info
      const linkHeader = response.headers.get('Link');
      nextPageUrl = null;
      
      if (linkHeader) {
        // Parse the Link header to get the next page URL
        const links = linkHeader.split(',');
        for (const link of links) {
          const match = link.match(/<(.+)>;\s*rel="next"/);
          if (match) {
            nextPageUrl = match[1];
            break;
          }
        }
      }
      
      console.log(`Next page URL: ${nextPageUrl || 'No more pages'}`);
      
    } catch (error) {
      console.error("Error fetching from Shopify API:", error);
      throw error;
    }
  } while (nextPageUrl);
  
  console.log(`Completed fetching all unfulfilled orders. Total: ${allOrders.length}`);
  
  // If we have orders with location_id, fetch location details
  const ordersWithLocations = allOrders || [];
  const locationIds = new Set();
  
  // Collect unique location IDs
  ordersWithLocations.forEach(order => {
    if (order.location_id) {
      locationIds.add(order.location_id.toString());
    }
  });
  
  // Create a map of location IDs to location names
  const locationMap = new Map();
  
  // Fetch location details if we have any location IDs
  if (locationIds.size > 0) {
    console.log(`Fetching details for ${locationIds.size} locations`);
    
    for (const locationId of locationIds) {
      try {
        const locationEndpoint = `https://${shopifyDomain}/admin/api/${apiVersion}/locations/${locationId}.json`;
        const locationResponse = await fetch(locationEndpoint, {
          method: "GET",
          headers: {
            "X-Shopify-Access-Token": apiToken,
            "Content-Type": "application/json",
          },
        });
        
        if (locationResponse.ok) {
          const locationData = await locationResponse.json();
          if (locationData.location && locationData.location.name) {
            locationMap.set(locationId, locationData.location.name);
            console.log(`Location ${locationId} name: ${locationData.location.name}`);
          }
        } else {
          console.error(`Error fetching location ${locationId}: ${locationResponse.status}`);
        }
      } catch (error) {
        console.error(`Error fetching location ${locationId}:`, error);
      }
    }
  }
  
  // Add location names to orders
  ordersWithLocations.forEach(order => {
    if (order.location_id) {
      order.location_name = locationMap.get(order.location_id.toString()) || null;
    }
  });
  
  return ordersWithLocations;
}

// Function to transform Shopify order to our database format
function transformShopifyOrder(order: any) {
  const customerName = order.customer ? 
    `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() : 
    "Unknown Customer";
  
  return {
    shopify_order_id: order.id.toString(),
    shopify_order_number: order.order_number?.toString(), // Store the customer-facing order number
    created_at: order.created_at,
    customer_name: customerName,
    customer_email: order.customer?.email || null,
    customer_phone: order.customer?.phone || null,
    items_count: order.line_items?.length || 0,
    line_items: order.line_items || null,
    shipping_address: order.shipping_address || null,
    note: order.note || null,
    location_id: order.location_id ? order.location_id.toString() : null,
    location_name: order.location_name || null,
    metadata: {
      fulfillment_status: order.fulfillment_status,
      tags: order.tags,
      order_number: order.order_number,
    },
    status: 'unfulfilled', // Explicitly mark as unfulfilled
    imported_at: new Date().toISOString(),
  };
}

// Extract line items from a Shopify order to insert into our line_items table
function extractLineItems(orderId: string, lineItems: any[]) {
  if (!lineItems || !Array.isArray(lineItems)) {
    return [];
  }
  
  return lineItems.map(item => ({
    order_id: orderId,
    shopify_line_item_id: item.id?.toString() || '0',
    sku: item.sku || null,
    product_id: item.product_id?.toString() || null,
    variant_id: item.variant_id?.toString() || null,
    title: item.title || 'Unknown Product',
    quantity: parseInt(item.quantity, 10) || 0,
    price: item.price ? parseFloat(item.price) : null,
    properties: item.properties || null
  }));
}

// Function to check for fulfilled orders and archive them
async function archiveFulfilledOrders(apiToken: string) {
  console.log("Checking for orders to archive...");
  
  try {
    // Get all orders from our database
    const { data: existingOrders, error: fetchError } = await supabase
      .from('shopify_orders')
      .select('id, shopify_order_id, status');
    
    if (fetchError) {
      console.error("Error fetching existing orders:", fetchError);
      return { archived: 0, error: fetchError };
    }
    
    if (!existingOrders || existingOrders.length === 0) {
      console.log("No existing orders to check for archiving");
      return { archived: 0 };
    }
    
    // Get order IDs to check - only check orders that are not already marked as unfulfilled in our db
    // This is important because we don't want to accidentally archive orders that are actually unfulfilled
    const shopifyOrderIds = existingOrders
      .filter(order => order.status !== 'unfulfilled')
      .map(order => order.shopify_order_id);
    
    // If no orders to check, return
    if (shopifyOrderIds.length === 0) {
      console.log("No orders eligible for archive check");
      return { archived: 0 };
    }
    
    console.log(`Checking ${shopifyOrderIds.length} orders for archiving`);
    
    // For each order, check Shopify status
    let archivedCount = 0;
    
    for (const chunk of chunkArray(shopifyOrderIds, 50)) {
      // Get these orders from Shopify
      const shopifyDomain = "opus-harley-davidson.myshopify.com";
      const apiVersion = "2023-07";
      
      for (const orderId of chunk) {
        const endpoint = `https://${shopifyDomain}/admin/api/${apiVersion}/orders/${orderId}.json`;
        
        try {
          const response = await fetch(endpoint, {
            method: "GET",
            headers: {
              "X-Shopify-Access-Token": apiToken,
              "Content-Type": "application/json",
            },
          });
          
          if (!response.ok) {
            if (response.status === 404) {
              console.log(`Order ${orderId} not found in Shopify, will archive`);
              await archiveOrder(orderId);
              archivedCount++;
              continue;
            }
            
            console.error(`Error checking order ${orderId}: ${response.status} ${response.statusText}`);
            continue;
          }
          
          const data = await response.json();
          const order = data.order;
          
          // If order is fulfilled or no longer unfulfilled, archive it
          // IMPORTANT: Double check that the order is ACTUALLY fulfilled
          if (order && order.fulfillment_status === 'fulfilled') {
            console.log(`Archiving order ${orderId} as it's now fulfilled`);
            await archiveOrder(orderId);
            archivedCount++;
          } else {
            console.log(`Order ${orderId} status is ${order?.fulfillment_status || 'unknown'}, not archiving`);
          }
        } catch (error) {
          console.error(`Error checking order ${orderId}:`, error);
        }
      }
    }
    
    console.log(`Archived ${archivedCount} orders that are no longer unfulfilled`);
    return { archived: archivedCount };
  } catch (error) {
    console.error("Error in archiving process:", error);
    return { archived: 0, error };
  }
}

// Helper function to chunk an array into smaller arrays
function chunkArray(array: any[], chunkSize: number) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Function to archive a specific order
async function archiveOrder(shopifyOrderId: string) {
  try {
    // Fetch the full order data
    const { data: orderData, error: fetchError } = await supabase
      .from('shopify_orders')
      .select('*')
      .eq('shopify_order_id', shopifyOrderId)
      .single();
      
    if (fetchError) {
      console.error(`Error fetching order ${shopifyOrderId} for archiving:`, fetchError);
      return false;
    }
    
    if (!orderData) {
      console.log(`Order ${shopifyOrderId} not found for archiving`);
      return false;
    }
    
    // CRITICAL CHECK: Don't archive unfulfilled orders
    if (orderData.status === 'unfulfilled') {
      console.log(`Order ${shopifyOrderId} is marked as unfulfilled, NOT archiving it`);
      return false;
    }
    
    console.log(`Archiving order ${shopifyOrderId} with status: ${orderData.status}`);
    
    // Insert into archive table
    const { data: archivedOrderData, error: insertError } = await supabase
      .from('shopify_archived_orders')
      .insert({
        ...orderData,
        archived_at: new Date().toISOString(),
      })
      .select('id')
      .single();
      
    if (insertError) {
      console.error(`Error inserting archived order ${shopifyOrderId}:`, insertError);
      return false;
    }
    
    // Now fetch and archive the line items
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('shopify_order_items')
      .select('*')
      .eq('order_id', orderData.id);
      
    if (lineItemsError) {
      console.error(`Error fetching line items for order ${shopifyOrderId}:`, lineItemsError);
      // Continue with order deletion, don't return false here as the order was archived
    }
    
    // If we have line items, archive them
    if (lineItems && lineItems.length > 0) {
      // Prepare line items for archiving by changing order_id to archived_order_id
      const archivedLineItems = lineItems.map(item => ({
        archived_order_id: archivedOrderData.id,
        shopify_line_item_id: item.shopify_line_item_id,
        sku: item.sku,
        product_id: item.product_id,
        variant_id: item.variant_id,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        properties: item.properties,
        created_at: item.created_at,
        archived_at: new Date().toISOString()
      }));
      
      const { error: archiveItemsError } = await supabase
        .from('shopify_archived_order_items')
        .insert(archivedLineItems);
        
      if (archiveItemsError) {
        console.error(`Error archiving line items for order ${shopifyOrderId}:`, archiveItemsError);
      }
    }
    
    // Delete line items for the order
    const { error: deleteItemsError } = await supabase
      .from('shopify_order_items')
      .delete()
      .eq('order_id', orderData.id);
      
    if (deleteItemsError) {
      console.error(`Error deleting line items for order ${shopifyOrderId}:`, deleteItemsError);
    }
    
    // Delete from active orders
    const { error: deleteError } = await supabase
      .from('shopify_orders')
      .delete()
      .eq('shopify_order_id', shopifyOrderId);
      
    if (deleteError) {
      console.error(`Error deleting order ${shopifyOrderId} after archiving:`, deleteError);
      return false;
    }
    
    console.log(`Successfully archived order ${shopifyOrderId} and its line items`);
    return true;
  } catch (error) {
    console.error(`Error in archive process for order ${shopifyOrderId}:`, error);
    return false;
  }
}

// Check and restore orders that are still unfulfilled but archived
async function restoreUnfulfilledArchivedOrders(shopifyOrderIds: string[]) {
  console.log(`Checking if any of ${shopifyOrderIds.length} incoming orders are incorrectly archived...`);
  
  if (!shopifyOrderIds || shopifyOrderIds.length === 0) {
    return { restored: 0 };
  }
  
  try {
    let restoredCount = 0;
    
    // Process in chunks to avoid query size limits
    for (const chunk of chunkArray(shopifyOrderIds, 50)) {
      // Check which of these order IDs exist in the archived table
      const { data: archivedOrders, error: queryError } = await supabase
        .from('shopify_archived_orders')
        .select('*')
        .in('shopify_order_id', chunk);
        
      if (queryError) {
        console.error('Error checking for archived orders:', queryError);
        continue;
      }
      
      if (!archivedOrders || archivedOrders.length === 0) {
        console.log(`No incorrectly archived orders found in this chunk`);
        continue;
      }
      
      console.log(`Found ${archivedOrders.length} orders in archive that should be active - restoring them`);
      
      // Restore each incorrectly archived order
      for (const archivedOrder of archivedOrders) {
        try {
          // First make sure the order doesn't already exist in active orders
          const { data: existingOrder } = await supabase
            .from('shopify_orders')
            .select('id')
            .eq('shopify_order_id', archivedOrder.shopify_order_id)
            .maybeSingle();
            
          if (existingOrder) {
            console.log(`Order ${archivedOrder.shopify_order_id} already exists in active orders, will delete from archive`);
            
            // Delete from archive since it exists in active
            await supabase
              .from('shopify_archived_order_items')
              .delete()
              .eq('archived_order_id', archivedOrder.id);
              
            await supabase
              .from('shopify_archived_orders')
              .delete()
              .eq('id', archivedOrder.id);
              
            restoredCount++;
            continue;
          }
          
          // Get archived line items
          const { data: archivedLineItems } = await supabase
            .from('shopify_archived_order_items')
            .select('*')
            .eq('archived_order_id', archivedOrder.id);
            
          // Restore order to active orders table
          const orderToRestore = {
            shopify_order_id: archivedOrder.shopify_order_id,
            shopify_order_number: archivedOrder.shopify_order_number,
            created_at: archivedOrder.created_at,
            customer_name: archivedOrder.customer_name,
            customer_email: archivedOrder.customer_email,
            customer_phone: archivedOrder.customer_phone,
            items_count: archivedOrder.items_count,
            shipping_address: archivedOrder.shipping_address,
            note: archivedOrder.note,
            status: 'unfulfilled', // Make sure it's marked as unfulfilled
            location_id: archivedOrder.location_id,
            location_name: archivedOrder.location_name,
            metadata: archivedOrder.metadata,
            imported_at: new Date().toISOString(),
          };
          
          const { data: insertedOrder, error: insertError } = await supabase
            .from('shopify_orders')
            .insert(orderToRestore)
            .select('id')
            .single();
            
          if (insertError) {
            console.error(`Error restoring archived order ${archivedOrder.id}:`, insertError);
            continue;
          }
          
          // Now restore line items if we have them
          if (archivedLineItems && archivedLineItems.length > 0) {
            const lineItemsToRestore = archivedLineItems.map(item => ({
              order_id: insertedOrder.id,
              shopify_line_item_id: item.shopify_line_item_id,
              sku: item.sku,
              product_id: item.product_id,
              variant_id: item.variant_id,
              title: item.title,
              quantity: item.quantity,
              price: item.price,
              properties: item.properties
            }));
            
            await supabase
              .from('shopify_order_items')
              .insert(lineItemsToRestore);
          }
          
          // Delete from archive tables
          if (archivedLineItems && archivedLineItems.length > 0) {
            await supabase
              .from('shopify_archived_order_items')
              .delete()
              .eq('archived_order_id', archivedOrder.id);
          }
          
          await supabase
            .from('shopify_archived_orders')
            .delete()
            .eq('id', archivedOrder.id);
            
          restoredCount++;
          console.log(`Successfully restored order ${archivedOrder.shopify_order_id} from archive`);
        } catch (error) {
          console.error(`Error restoring archived order ${archivedOrder.id}:`, error);
        }
      }
    }
    
    console.log(`Restored ${restoredCount} incorrectly archived orders`);
    return { restored: restoredCount };
  } catch (error) {
    console.error('Error in restore check process:', error);
    return { restored: 0, error };
  }
}

// Function to synchronize Shopify orders
async function syncShopifyOrders(apiToken: string, skipArchiving = false) {
  console.log(`Starting Shopify order sync (skipArchiving=${skipArchiving})...`);
  
  try {
    let archiveResult = { archived: 0 };
    
    // Only archive fulfilled orders if skipArchiving is false
    if (!skipArchiving) {
      archiveResult = await archiveFulfilledOrders(apiToken);
      console.log(`Archive process completed: ${archiveResult.archived} orders archived`);
    } else {
      console.log('Skipping archive process as requested');
    }
    
    // Then fetch current unfulfilled orders from Shopify
    const shopifyOrders = await fetchShopifyOrders(apiToken);
    
    // Get the shopify_order_ids to check if any are incorrectly archived
    const shopifyOrderIds = shopifyOrders.map((order: any) => order.id.toString());
    
    // Check and restore any orders that are incorrectly archived
    const restoreResult = await restoreUnfulfilledArchivedOrders(shopifyOrderIds);
    
    // Get existing orders from our database to avoid duplicates
    const { data: existingOrders, error: fetchError } = await supabase
      .from('shopify_orders')
      .select('shopify_order_id');
      
    if (fetchError) {
      console.error("Error fetching existing orders:", fetchError);
      return { 
        success: false, 
        error: fetchError.message,
        archived: archiveResult.archived,
        restored: restoreResult.restored
      };
    }
    
    const existingOrderIds = new Set(existingOrders?.map(o => o.shopify_order_id) || []);
    
    // Transform Shopify orders to our format
    const ordersToInsert = shopifyOrders
      .filter((order: any) => !existingOrderIds.has(order.id.toString()))
      .map(transformShopifyOrder);
    
    console.log(`Found ${ordersToInsert.length} new orders to insert`);
    
    // Insert new orders in batches and track their IDs
    const batchSize = 50;
    let insertedCount = 0;
    let insertedOrderIds = [];
    
    for (let i = 0; i < ordersToInsert.length; i += batchSize) {
      const batch = ordersToInsert.slice(i, i + batchSize);
      
      if (batch.length > 0) {
        const { data: insertedOrders, error: insertError } = await supabase
          .from('shopify_orders')
          .insert(batch)
          .select('id, shopify_order_id, line_items');
          
        if (insertError) {
          console.error(`Error inserting batch ${i}/${ordersToInsert.length}:`, insertError);
        } else if (insertedOrders) {
          insertedCount += insertedOrders.length;
          console.log(`Inserted batch ${i}/${ordersToInsert.length} (${insertedOrders.length} orders)`);
          
          // For each inserted order, extract and insert its line items
          for (const order of insertedOrders) {
            if (order.line_items && Array.isArray(order.line_items)) {
              const lineItems = extractLineItems(order.id, order.line_items);
              
              if (lineItems.length > 0) {
                const { error: lineItemError } = await supabase
                  .from('shopify_order_items')
                  .insert(lineItems);
                  
                if (lineItemError) {
                  console.error(`Error inserting line items for order ${order.shopify_order_id}:`, lineItemError);
                } else {
                  console.log(`Inserted ${lineItems.length} line items for order ${order.shopify_order_id}`);
                }
              }
            }
          }
          
          insertedOrderIds = insertedOrderIds.concat(insertedOrders.map(o => o.id));
        }
      }
    }
    
    // Update last sync time in settings
    await supabase.rpc('upsert_shopify_setting', { 
      setting_name_param: 'last_sync_time', 
      setting_value_param: new Date().toISOString() 
    });
    console.log('Updated last sync time in database');
    
    return { 
      success: true,
      imported: insertedCount,
      archived: archiveResult.archived,
      restored: restoreResult.restored,
      total_unfulfilled: shopifyOrders.length
    };
  } catch (error) {
    console.error("Error in Shopify sync process:", error);
    return { 
      success: false, 
      error: error.message || "Unknown error in sync process"
    };
  }
}

// Main handler for HTTP requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // First try to get the token from the request body
    let apiToken;
    let source = 'manual';
    let skipArchiving = false;
    
    if (req.method === 'POST') {
      // Extract API token from request body
      const body = await req.json();
      apiToken = body.apiToken;
      // Extract the source if provided (manual or cron)
      source = body.source || 'manual';
      // Whether to skip archiving
      skipArchiving = body.skipArchiving === true;
      
      // If no token in request, try to get it from the database
      if (!apiToken) {
        console.log(`No token in request (source: ${source}), trying to get from database`);
        apiToken = await getApiTokenFromDatabase();
        
        if (!apiToken) {
          return new Response(
            JSON.stringify({ error: "API token not found in request or database" }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
      }
    } else {
      return new Response(
        JSON.stringify({ error: "Only POST requests are supported" }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log(`Starting Shopify sync (source: ${source}, skipArchiving: ${skipArchiving})...`);
    
    // Perform the sync operation
    const result = await syncShopifyOrders(apiToken, skipArchiving);
    
    // If this was triggered by a cron job, update the last cron run time
    // Also ensure auto_import_enabled is set to true
    if (source === 'cron') {
      console.log('Updating last cron run time and ensuring auto_import_enabled is true');
      
      // Update last cron run time
      await supabase.rpc('upsert_shopify_setting', { 
        setting_name_param: 'last_cron_run', 
        setting_value_param: new Date().toISOString() 
      });
      
      // Make sure auto_import_enabled is set to true
      await supabase.rpc('upsert_shopify_setting', { 
        setting_name_param: 'auto_import_enabled', 
        setting_value_param: 'true'
      });
    }
    
    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error in Shopify sync function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Internal Server Error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
