
import { fetchAllShopifyOrdersWithPagination } from "./shopifyOrdersApi.ts";
import { debug } from "./debugUtils.ts";
import { filterActiveUnfulfilledOrders } from "./filterUtils.ts";

/**
 * Import orders from Shopify with pagination handling
 */
export async function importOrdersFromShopify(
  apiToken: string, 
  apiEndpoint: string,
  debug: (message: string) => void
): Promise<any[]> {
  try {
    debug(`Starting import of orders from Shopify using endpoint: ${apiEndpoint}`);
    let allOrders: any[] = [];
    let nextPageUrl: string | null = apiEndpoint;
    let pageCount = 0;
    
    // Use pagination to get all orders
    while (nextPageUrl) {
      pageCount++;
      debug(`Fetching page ${pageCount} of orders`);
      
      const { orders, nextPageUrl: newNextPageUrl } = await fetchAllShopifyOrdersWithPagination(apiToken, nextPageUrl);
      debug(`Received ${orders.length} orders from page ${pageCount}`);
      
      allOrders = [...allOrders, ...orders];
      nextPageUrl = newNextPageUrl;
      
      debug(`Total orders fetched so far: ${allOrders.length}`);
      
      // Limit to prevent potential infinite loops
      if (pageCount > 10) {
        debug("Reached maximum page limit (10). Breaking pagination loop.");
        break;
      }
    }
    
    debug(`Completed import from Shopify API. Total orders: ${allOrders.length}`);
    return allOrders;
  } catch (error: any) {
    debug(`Error importing orders from Shopify: ${error.message}`);
    throw error;
  }
}

/**
 * Build a Shopify API endpoint URL with filters
 */
export function buildFilteredShopifyEndpoint(
  baseEndpoint: string, 
  filters: Record<string, any>,
  debug: (message: string) => void
): string {
  try {
    debug(`Building filtered Shopify endpoint from base: ${baseEndpoint}`);
    
    // Start with the base URL
    const url = new URL(baseEndpoint);
    
    // Add each filter as a query parameter
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
        debug(`Added filter: ${key}=${value}`);
      }
    }
    
    debug(`Final filtered endpoint: ${url.toString()}`);
    return url.toString();
  } catch (error: any) {
    debug(`Error building filtered endpoint: ${error.message}`);
    throw error;
  }
}

/**
 * Process orders in batches to prevent memory issues
 */
export async function processOrdersInBatches(
  orders: any[],
  processFn: (order: any, orderId: string, orderNumber: string, debug: (message: string) => void) => Promise<boolean>,
  debug: (message: string) => void,
  batchSize = 10
): Promise<number> {
  try {
    debug(`Processing ${orders.length} orders in batches of ${batchSize}`);
    let processed = 0;
    
    // Process in batches to prevent memory issues
    for (let i = 0; i < orders.length; i += batchSize) {
      const batch = orders.slice(i, i + batchSize);
      debug(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(orders.length / batchSize)}`);
      
      // Process each order in the batch
      const results = await Promise.all(
        batch.map(async (order) => {
          try {
            const orderId = order.id.toString();
            const orderNumber = order.name || order.order_number?.toString() || 'unknown';
            
            debug(`Processing order ${orderNumber} (${orderId})`);
            const success = await processFn(order, orderId, orderNumber, debug);
            
            if (success) {
              debug(`Successfully processed order ${orderNumber}`);
              return 1;
            } else {
              debug(`Failed to process order ${orderNumber}`);
              return 0;
            }
          } catch (err: any) {
            debug(`Error processing order: ${err.message}`);
            return 0;
          }
        })
      );
      
      // Count successful imports in this batch
      const batchProcessed = results.reduce((sum, val) => sum + val, 0);
      processed += batchProcessed;
      
      debug(`Batch complete: ${batchProcessed} of ${batch.length} orders processed successfully`);
    }
    
    debug(`All batches processed. Total successfully processed: ${processed} of ${orders.length}`);
    return processed;
  } catch (error: any) {
    debug(`Error in batch processing: ${error.message}`);
    throw error;
  }
}
