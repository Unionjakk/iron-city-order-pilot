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

// NEW FUNCTION: Check fulfilled status for all active orders in the database
// This allows us to accurately determine which orders are truly fulfilled and should be archived
async function checkAllActiveOrdersFulfillmentStatus(apiToken: string) {
  console.log("Checking fulfillment status of all active orders in database...");
  
  try {
    // Fetch all active orders from database
    const { data: activeOrders, error: fetchError } = await supabase
      .from('shopify_orders')
      .select('id, shopify_order_id');
      
    if (fetchError) {
      console.error("Error fetching active orders:", fetchError);
      return { success: false, error: fetchError.message };
    }
    
    if (!activeOrders || activeOrders.length === 0) {
      console.log("No active orders to check");
      return { success: true, archived: 0 };
    }
    
    console.log(`Found ${activeOrders.length} active orders to check fulfillment status`);
    
    const shopifyDomain = "opus-harley-davidson.myshopify.com";
    const apiVersion = "2023-07";
    
    let archivedCount = 0;
    let errorCount = 0;
    
    // Process orders in smaller batches
    for (const chunk of chunkArray(activeOrders, 10)) {
      for (const order of chunk) {
        try {
          const orderEndpoint = `https://${shopifyDomain}/admin/api/${apiVersion}/orders/${order.shopify_order_id}.json`;
          
          console.log(`Checking fulfillment status for order ${order.shopify_order_id}`);
          
          const response = await fetch(orderEndpoint, {
            method: "GET",
            headers: {
              "X-Shopify-Access-Token": apiToken,
              "Content-Type": "application/json",
            },
          });
          
          if (!response.ok) {
            if (response.status === 404) {
              console.log(`Order ${order.shopify_order_id} not found in Shopify, will archive`);
              const archived = await archiveOrder(order.shopify_order_id);
              if (archived) archivedCount++;
              continue;
            }
            
            console.error(`Error checking order ${order.shopify_order_id}: ${response.status} ${response.statusText}`);
            errorCount++;
            continue;
          }
          
          const data = await response.json();
          
          if (!data.order) {
            console.error(`No order data returned for ${order.shopify_order_id}`);
            continue;
          }
          
          // Check if order is fulfilled in Shopify
          if (data.order.fulfillment_status === 'fulfilled') {
            console.log(`Order ${order.shopify_order_id} is now fulfilled in Shopify, archiving`);
            const archived = await archiveOrder(order.shopify_order_id);
            if (archived) archivedCount++;
          } else {
            console.log(`Order ${order.shopify_order_id} fulfillment status: ${data.order.fulfillment_status || 'null'}, keeping active`);
            
            // Update the status in our database to match Shopify (could be partial or null)
            if (data.order.fulfillment_status) {
              await supabase
                .from('shopify_orders')
                .update({ 
                  status: data.order.fulfillment_status,
                  metadata: {
                    ...data.order.metadata,
                    fulfillment_status: data.order.fulfillment_status
                  }
                })
                .eq('shopify_order_id', order.shopify_order_id);
            }
          }
        } catch (error) {
          console.error(`Error processing order ${order.shopify_order_id}:`, error);
          errorCount++;
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`Finished checking fulfillment status: ${archivedCount} orders archived, ${errorCount} errors`);
    return { success: true, archived: archivedCount, errors: errorCount };
  } catch (error) {
    console.error("Error checking order fulfillment status:", error);
    return { success: false, error: error.message };
  }
}

// Function to check for incorrect archived orders (unfulfilled orders in the archive)
// This replaces the old archiveFulfilledOrders function
async function checkAndFixArchivedUnfulfilledOrders() {
  console.log("Checking for incorrectly archived unfulfilled orders...");
  
  try {
    // Find unfulfilled orders in archive
    const { data: archivedUnfulfilled, error: archiveError } = await supabase
      .from('shopify_archived_orders')
      .select('*')
      .eq('status', 'unfulfilled');
      
    if (archiveError) {
      console.error("Error checking archived orders:", archiveError);
      return { restored: 0, error: archiveError };
    }
    
    if (!archivedUnfulfilled || archivedUnfulfilled.length === 0) {
      console.log("No incorrectly archived unfulfilled orders found");
      return { restored: 0 };
    }
    
    console.log(`Found ${archivedUnfulfilled.length} unfulfilled orders in archive that need to be moved back to active`);
    
    let restoredCount = 0;
    
    for (const archivedOrder of archivedUnfulfilled) {
      try {
        // First check if order already exists in active orders
        const { data: existingOrder } = await supabase
          .from('shopify_orders')
          .select('id')
          .eq('shopify_order_id', archivedOrder.shopify_order_id)
          .maybeSingle();
          
        if (existingOrder) {
          console.log(`Order ${archivedOrder.shopify_order_id} already exists in active orders, removing from archive`);
          
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
          
        // Prepare order for insert
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
          status: 'unfulfilled', // Ensure it's marked as unfulfilled
          location_id: archivedOrder.location_id,
          location_name: archivedOrder.location_name,
          metadata: archivedOrder.metadata,
          imported_at: new Date().toISOString(),
        };
        
        // Insert into active orders
        const { data: insertedOrder, error: insertError } = await supabase
          .from('shopify_orders')
          .insert(orderToRestore)
          .select('id')
          .single();
          
        if (insertError) {
          console.error(`Error restoring archived order ${archivedOrder.shopify_order_id}:`, insertError);
          continue;
        }
        
        console.log(`Restored order ${archivedOrder.shopify_order_id} to active orders`);
        
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
          
          const { error: lineItemsError } = await supabase
            .from('shopify_order_items')
            .insert(lineItemsToRestore);
            
          if (lineItemsError) {
            console.error(`Error restoring line items for order ${archivedOrder.shopify_order_id}:`, lineItemsError);
          } else {
            console.log(`Restored ${lineItemsToRestore.length} line items for order ${archivedOrder.shopify_order_id}`);
          }
        }
        
        // Delete from archive tables
        await supabase
          .from('shopify_archived_order_items')
          .delete()
          .eq('archived_order_id', archivedOrder.id);
          
        await supabase
          .from('shopify_archived_orders')
          .delete()
          .eq('id', archivedOrder.id);
          
        restoredCount++;
      } catch (error) {
        console.error(`Error processing archived order ${archivedOrder.shopify_order_id}:`, error);
      }
    }
    
    console.log(`Restored ${restoredCount} unfulfilled orders from archive to active orders`);
    return { restored: restoredCount };
  } catch (error) {
    console.error("Error checking archived unfulfilled orders:", error);
    return { restored: 0, error: error.message };
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

// Check for orders that exist in both active and archive tables and fix the issue
async function fixDuplicateOrders() {
  console.log("Checking for orders existing in both active and archive tables...");
  
  try {
    // Get all active orders
    const { data: activeOrders, error: activeError } = await supabase
      .from('shopify_orders')
      .select('shopify_order_id, status');
      
    if (activeError) {
      console.error("Error fetching active orders:", activeError);
      return { fixed: 0, error: activeError };
    }
    
    if (!activeOrders || activeOrders.length === 0) {
      console.log("No active orders to check for duplicates");
      return { fixed: 0 };
    }
    
    const activeOrderIds = activeOrders.map(order => order.shopify_order_id);
    
    // Find archived orders with the same IDs
    const { data: archivedDuplicates, error: archiveError } = await supabase
      .from('shopify_archived_orders')
      .select('*')
      .in('shopify_order_id', activeOrderIds);
      
    if (archiveError) {
      console.error("Error checking archived orders:", archiveError);
      return { fixed: 0, error: archiveError };
    }
    
    if (!archivedDuplicates || archivedDuplicates.length === 0) {
      console.log("No duplicate orders found");
      return { fixed: 0 };
    }
    
    console.log(`Found ${archivedDuplicates.length} orders that exist in both active and archive tables`);
    
    let fixedCount = 0;
    
    for (const archivedOrder of archivedDuplicates) {
      try {
        // Find the matching active order to determine what to do
        const activeOrder = activeOrders.find(o => o.shopify_order_id === archivedOrder.shopify_order_id);
        
        if (!activeOrder) {
          console.log(`No matching active order found for archived order ${archivedOrder.shopify_order_id}, skipping`);
          continue;
        }
        
        console.log(`Found duplicate: Order ${archivedOrder.shopify_order_id} - Active status: ${activeOrder.status}, Archived status: ${archivedOrder.status}`);
        
        // Check which version to keep - keep unfulfilled in active, fulfilled in archive
        if (activeOrder.status === 'unfulfilled' && archivedOrder.status !== 'unfulfilled') {
          // Keep the unfulfilled active order, remove from archive
          console.log(`Order ${archivedOrder.shopify_order_id} is unfulfilled in active but fulfilled in archive - keeping active, removing from archive`);
          
          // Delete from archive
          await supabase
            .from('shopify_archived_order_items')
            .delete()
            .eq('archived_order_id', archivedOrder.id);
            
          await supabase
            .from('shopify_archived_orders')
            .delete()
            .eq('id', archivedOrder.id);
            
          fixedCount++;
        }
        else if (activeOrder.status !== 'unfulfilled' && archivedOrder.status === 'unfulfilled') {
          // Keep the unfulfilled archived order, remove from active and move to active
          console.log(`Order ${archivedOrder.shopify_order_id} is fulfilled in active but unfulfilled in archive - moving from archive to active`);
          
          // First delete the active order and its line items
          await supabase
            .from('shopify_order_items')
            .delete()
            .eq('order_id', activeOrder.id);
            
          await supabase
            .from('shopify_orders')
            .delete()
            .eq('shopify_order_id', activeOrder.shopify_order_id);
          
          // Now restore the archived order to active
          // Get archived line items
          const { data: archivedLineItems } = await supabase
            .from('shopify_archived_order_items')
            .select('*')
            .eq('archived_order_id', archivedOrder.id);
            
          // Prepare order for insert
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
            status: 'unfulfilled', // Ensure it's marked as unfulfilled
            location_id: archivedOrder.location_id,
            location_name: archivedOrder.location_name,
            metadata: archivedOrder.metadata,
            imported_at: new Date().toISOString(),
          };
          
          // Insert into active orders
          const { data: insertedOrder, error: insertError } = await supabase
            .from('shopify_orders')
            .insert(orderToRestore)
            .select('id')
            .single();
            
          if (insertError) {
            console.error(`Error restoring duplicate archive order ${archivedOrder.shopify_order_id}:`, insertError);
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
          await supabase
            .from('shopify_archived_order_items')
            .delete()
            .eq('archived_order_id', archivedOrder.id);
            
          await supabase
            .from('shopify_archived_orders')
            .delete()
            .eq('id', archivedOrder.id);
            
          fixedCount++;
        }
        else if (activeOrder.status === 'unfulfilled' && archivedOrder.status === 'unfulfilled') {
          // Both are unfulfilled, just remove from archive
          console.log(`Order ${archivedOrder.shopify_order_id} is unfulfilled in both active and archive - keeping active, removing from archive`);
          
          // Delete from archive
          await supabase
            .from('shopify_archived_order_items')
            .delete()
            .eq('archived_order_id', archivedOrder.id);
            
          await supabase
            .from('shopify_archived_orders')
            .delete()
            .eq('id', archivedOrder.id);
            
          fixedCount++;
        }
        else {
          // Both are fulfilled, keep in archive and remove from active
          console.log(`Order ${archivedOrder.shopify_order_id} is fulfilled in both active and archive - keeping in archive, removing from active`);
          
          await supabase
            .from('shopify_order_items')
            .delete()
            .eq('order_id', activeOrder.id);
            
          await supabase
            .from('shopify_orders')
            .delete()
            .eq('shopify_order_id', activeOrder.shopify_order_id);
            
          fixedCount++;
        }
      } catch (error) {
        console.error(`Error fixing duplicate order ${archivedOrder.shopify_order_id}:`, error);
      }
    }
    
    console.log(`Fixed ${fixedCount} duplicate orders`);
    return { fixed: fixedCount };
  } catch (error) {
    console.error("Error fixing duplicate orders:", error);
    return { fixed: 0, error: error.message };
  }
}

// Function to synchronize Shopify orders
async function syncShopifyOrders(apiToken: string, skipArchiving = false) {
  console.log(`Starting Shopify order sync (skipArchiving=${skipArchiving})...`);
  
  try {
    // First fix any duplicates
    const duplicateResult = await fixDuplicateOrders();
    console.log(`Duplicate check complete: ${duplicateResult.fixed} duplicates fixed`);
    
    // Check and fix incorrectly archived unfulfilled orders
    const archiveFixResult = await checkAndFixArchivedUnfulfilledOrders();
    console.log(`Archive fix complete: ${archiveFixResult.restored} orders restored`);
    
    // Fetch current unfulfilled orders from Shopify
    const shopifyOrders = await fetchShopifyOrders(apiToken);
    console.log(`Fetched ${shopifyOrders.length} unfulfilled orders from Shopify`);
    
    // Get existing orders from our database to avoid duplicates
    const { data: existingOrders, error: fetchError } = await supabase
      .from('shopify_orders')
      .select('shopify_order_id, status');
      
    if (fetchError) {
      console.error("Error fetching existing orders:", fetchError);
      return { 
        success: false, 
        error: fetchError.message,
        duplicates_fixed: duplicateResult.fixed,
        unfulfilled_restored: archiveFixResult.restored
      };
    }
    
    // Transform to map for faster lookup
    const existingOrderMap = new Map();
    existingOrders?.forEach(order => {
      existingOrderMap.set(order.shopify_order_id, order.status);
    });
    
    // Transform Shopify orders to our format, but only include ones that either:
    // 1. Don't exist in our database yet
    // 2. Are marked as something other than unfulfilled in our database
    const ordersToUpsert = [];
    
    for (const order of shopifyOrders) {
      const existingStatus = existingOrderMap.get(order.id.toString());
      
      if (!existingStatus) {
        // New order, add it
        ordersToUpsert.push(transformShopifyOrder(order));
      }
      else if (existingStatus !== 'unfulfilled') {
        // Order exists but is not unfulfilled in our DB, update to unfulfilled
        console.log(`Order ${order.id} exists with status ${existingStatus} but is unfulfilled in Shopify, updating`);
        const transformedOrder = transformShopifyOrder(order);
        ordersToUpsert.push(transformedOrder);
      }
      else {
        console.log(`Order ${order.id} already exists as unfulfilled, skipping`);
      }
    }
    
    console.log(`Found ${ordersToUpsert.length} orders to insert or update`);
    
    // Insert new orders in batches and track their IDs
    const batchSize = 50;
    let insertedCount = 0;
    let insertedOrderIds = [];
    
    for (let i = 0; i < ordersToUpsert.length; i += batchSize) {
      const batch = ordersToUpsert.slice(i, i + batchSize);
      
      if (batch.length > 0) {
        const { data: insertedOrders, error: insertError } = await supabase
          .from('shopify_orders')
          .upsert(batch, { 
            onConflict: 'shopify_order_id', 
            ignoreDuplicates: false
          })
          .select('id, shopify_order_id, line_items');
          
        if (insertError) {
          console.error(`Error upserting batch ${i}/${ordersToUpsert.length}:`, insertError);
        } else if (insertedOrders) {
          insertedCount += insertedOrders.length;
          console.log(`Upserted batch ${i}/${ordersToUpsert.length} (${insertedOrders.length} orders)`);
          
          // For each inserted order, extract and insert its line items
          for (const order of insertedOrders) {
            if (order.line_items && Array.isArray(order.line_items)) {
              // First remove any existing line items
              await supabase
                .from('shopify_order_items')
                .delete()
                .eq('order_id', order.id);
                
              // Then insert new ones
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
    
    // Only run the fulfilled order check if not skipping archiving
    let archiveResult = { archived: 0, errors: 0 };
    
    if (!skipArchiving) {
      console.log("Running fulfillment status check on all active orders");
      archiveResult = await checkAllActiveOrdersFulfillmentStatus(apiToken);
    } else {
      console.log("Skipping archive process as requested");
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
      archived: archiveResult.archived || 0,
      archive_errors: archiveResult.errors || 0,
      duplicates_fixed: duplicateResult.fixed,
      unfulfilled_restored: archiveFixResult.restored,
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
