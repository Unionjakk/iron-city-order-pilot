
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.6";
import { DbLineItem, LineItemLocationUpdate } from "./types.ts";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Get line items without location information
 */
export async function getLineItemsWithoutLocations(debug: (message: string) => void): Promise<any[]> {
  try {
    debug("Querying database for line items without location information");
    
    const { data: lineItems, error } = await supabase
      .from("shopify_order_items")
      .select(`
        id, 
        shopify_line_item_id, 
        title,
        order_id,
        shopify_orders!inner(shopify_order_id)
      `)
      .is("location_id", null)
      .limit(500); // Limit to 500 items per batch for performance
    
    if (error) {
      debug(`Error retrieving line items: ${error.message}`);
      throw new Error(`Failed to retrieve line items: ${error.message}`);
    }
    
    // Transform the results to include Shopify order ID directly
    const transformedItems = lineItems ? lineItems.map(item => ({
      id: item.id,
      shopify_line_item_id: item.shopify_line_item_id,
      title: item.title,
      order_id: item.order_id,
      shopify_order_id: item.shopify_orders.shopify_order_id
    })) : [];
    
    debug(`Found ${transformedItems.length} line items without location information`);
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
    const batchSize = 10; // Process 10 updates at a time (smaller batches)
    let updatedCount = 0;
    
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      debug(`Processing update batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(updates.length/batchSize)}`);
      
      // Process each update individually for better error handling
      for (const update of batch) {
        try {
          const { error } = await supabase
            .from("shopify_order_items")
            .update({
              location_id: update.location_id,
              location_name: update.location_name,
              updated_at: new Date().toISOString()
            })
            .eq("id", update.id);
          
          if (error) {
            debug(`Error updating line item ${update.id}: ${error.message}`);
          } else {
            updatedCount++;
            debug(`Successfully updated line item ${update.id}`);
          }
        } catch (updateError: any) {
          debug(`Exception updating line item ${update.id}: ${updateError.message}`);
        }
      }
      
      debug(`Updated ${updatedCount}/${updates.length} line items so far`);
      
      // Add short delay between batches to avoid overwhelming the database
      if (i + batchSize < updates.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    debug(`Successfully updated ${updatedCount}/${updates.length} line items in total`);
    return updatedCount;
  } catch (error: any) {
    debug(`Exception in updateLineItemLocations: ${error.message}`);
    throw error;
  }
}
