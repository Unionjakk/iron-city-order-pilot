
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.6";
import { DbLineItem, LineItemLocationUpdate } from "./types.ts";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Get all line items that need location information updated
 */
export async function getLineItemsWithoutLocations(debug: (message: string) => void): Promise<any[]> {
  try {
    debug("Querying database for all line items needing location information");
    
    // Create paginated query to handle large datasets
    let allLineItems: any[] = [];
    let page = 0;
    const pageSize = 1000; // Process 1000 items per page
    let hasMore = true;
    
    while (hasMore) {
      debug(`Fetching page ${page + 1} of line items, ${pageSize} items per page`);
      
      const { data: lineItems, error } = await supabase
        .from("shopify_order_items")
        .select(`
          id, 
          shopify_line_item_id, 
          title,
          order_id,
          shopify_orders!inner(shopify_order_id)
        `)
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) {
        debug(`Error retrieving line items page ${page + 1}: ${error.message}`);
        throw new Error(`Failed to retrieve line items: ${error.message}`);
      }
      
      if (lineItems && lineItems.length > 0) {
        // Transform the results to include Shopify order ID directly
        const transformedItems = lineItems.map(item => ({
          id: item.id,
          shopify_line_item_id: item.shopify_line_item_id,
          title: item.title,
          order_id: item.order_id,
          shopify_order_id: item.shopify_orders.shopify_order_id
        }));
        
        allLineItems = [...allLineItems, ...transformedItems];
        debug(`Added ${transformedItems.length} line items from page ${page + 1}`);
        
        // If we got less than the page size, we've reached the end
        if (lineItems.length < pageSize) {
          hasMore = false;
          debug(`Reached the end of line items at page ${page + 1}`);
        }
      } else {
        hasMore = false;
        debug(`No more line items found at page ${page + 1}`);
      }
      
      page++;
    }
    
    debug(`Found a total of ${allLineItems.length} line items to update with location information`);
    return allLineItems;
  } catch (error: any) {
    debug(`Exception in getLineItemsWithoutLocations: ${error.message}`);
    throw error;
  }
}

/**
 * Update location information for line items
 */
export async function updateLineItemLocations(
  updates: LineItemLocationUpdate[],
  debug: (message: string) => void
): Promise<number> {
  if (!updates || updates.length === 0) {
    debug("No updates to process");
    return 0;
  }
  
  try {
    debug(`Updating location information for ${updates.length} line items`);
    
    // Split updates into smaller batches for better reliability
    const batchSize = 50; // Process 50 updates at a time (increased from 25 for better performance)
    let updatedCount = 0;
    
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      debug(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(updates.length/batchSize)}, with ${batch.length} items`);
      
      // Create array of update operations
      const updatePromises = batch.map(update => {
        return supabase
          .from("shopify_order_items")
          .update({
            location_id: update.location_id,
            location_name: update.location_name
          })
          .eq("id", update.id);
      });
      
      // Execute all updates in parallel
      const results = await Promise.all(updatePromises);
      
      // Count successful updates
      const batchSuccessCount = results.filter(result => !result.error).length;
      updatedCount += batchSuccessCount;
      
      // Log errors if any
      results.forEach((result, index) => {
        if (result.error) {
          debug(`Error updating line item ${batch[index].id}: ${result.error.message}`);
        }
      });
      
      debug(`Updated ${batchSuccessCount}/${batch.length} line items in batch ${Math.floor(i/batchSize) + 1}`);
      
      // Add a small delay between batches to prevent database connection issues
      if (i + batchSize < updates.length) {
        await new Promise(resolve => setTimeout(resolve, 300)); // Reduced delay to 300ms for faster processing
      }
    }
    
    debug(`Successfully updated ${updatedCount}/${updates.length} line items in total`);
    return updatedCount;
  } catch (error: any) {
    debug(`Exception in updateLineItemLocations: ${error.message}`);
    throw error;
  }
}

/**
 * Get information for a single line item
 */
export async function getSingleLineItemInfo(
  shopifyOrderId: string,
  lineItemId: string,
  debug: (message: string) => void
): Promise<any | null> {
  try {
    debug(`Looking up line item information in database for Order ID: ${shopifyOrderId}, Line Item ID: ${lineItemId}`);
    
    // First get the order ID from the database
    const { data: orderData, error: orderError } = await supabase
      .from("shopify_orders")
      .select("id")
      .eq("shopify_order_id", shopifyOrderId)
      .maybeSingle();
    
    if (orderError) {
      debug(`Error finding order in database: ${orderError.message}`);
      throw new Error(`Failed to find order: ${orderError.message}`);
    }
    
    if (!orderData) {
      debug(`Order with Shopify ID ${shopifyOrderId} not found in database`);
      return null;
    }
    
    const orderId = orderData.id;
    debug(`Found order in database with ID: ${orderId}`);
    
    // Now get the line item
    const { data: lineItemData, error: lineItemError } = await supabase
      .from("shopify_order_items")
      .select("id, shopify_line_item_id, title, sku, location_id, location_name")
      .eq("order_id", orderId)
      .eq("shopify_line_item_id", lineItemId)
      .maybeSingle();
    
    if (lineItemError) {
      debug(`Error finding line item in database: ${lineItemError.message}`);
      throw new Error(`Failed to find line item: ${lineItemError.message}`);
    }
    
    if (!lineItemData) {
      debug(`Line item with ID ${lineItemId} not found in database for order ${orderId}`);
      return null;
    }
    
    debug(`Found line item in database: ${JSON.stringify(lineItemData)}`);
    return lineItemData;
  } catch (error: any) {
    debug(`Exception in getSingleLineItemInfo: ${error.message}`);
    throw error;
  }
}

/**
 * Update location information for a single line item
 */
export async function updateSingleLineItemLocation(
  update: LineItemLocationUpdate,
  debug: (message: string) => void
): Promise<boolean> {
  try {
    debug(`Updating single line item location information for item ID: ${update.id}`);
    
    const { data, error } = await supabase
      .from("shopify_order_items")
      .update({
        location_id: update.location_id,
        location_name: update.location_name
      })
      .eq("id", update.id);
    
    if (error) {
      debug(`Error updating line item location: ${error.message}`);
      throw new Error(`Failed to update line item location: ${error.message}`);
    }
    
    debug(`Successfully updated location information for line item ${update.id}`);
    return true;
  } catch (error: any) {
    debug(`Exception in updateSingleLineItemLocation: ${error.message}`);
    throw error;
  }
}
