
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.6";
import { DbLineItem, LineItemLocationUpdate } from "./types.ts";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Get line items without location information or all line items
 */
export async function getLineItemsWithoutLocations(debug: (message: string) => void): Promise<any[]> {
  try {
    debug("Querying database for line items needing location information");
    
    const { data: lineItems, error } = await supabase
      .from("shopify_order_items")
      .select(`
        id, 
        shopify_line_item_id, 
        title,
        order_id,
        shopify_orders!inner(shopify_order_id)
      `)
      .limit(500); // Limit to 500 items per batch for performance
    
    if (error) {
      debug(`Error retrieving line items: ${error.message}`);
      throw new Error(`Failed to retrieve line items: ${error.message}`);
    }
    
    // Transform the results to include Shopify order ID directly
    const transformedItems = lineItems.map(item => ({
      id: item.id,
      shopify_line_item_id: item.shopify_line_item_id,
      title: item.title,
      order_id: item.order_id,
      shopify_order_id: item.shopify_orders.shopify_order_id
    }));
    
    debug(`Found ${transformedItems.length} line items to update with location information`);
    return transformedItems;
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
    const batchSize = 25; // Process 25 updates at a time (reduced for more stability)
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
            location_name: update.location_name,
            updated_at: new Date().toISOString()
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
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    debug(`Successfully updated ${updatedCount}/${updates.length} line items in total`);
    return updatedCount;
  } catch (error: any) {
    debug(`Exception in updateLineItemLocations: ${error.message}`);
    throw error;
  }
}
