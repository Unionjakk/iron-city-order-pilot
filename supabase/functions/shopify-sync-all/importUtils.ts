import { ShopifyOrder } from "./types.ts";
import { fetchAllShopifyOrdersWithPagination, fetchNextPage } from "./shopifyApi.ts";
import { withTimeout, IMPORT_TIMEOUT_MS, MAX_RETRIES, calculateBackoffDelay } from "./timeoutUtils.ts";

/**
 * Import orders from Shopify API with pagination and error handling
 */
export async function importOrdersFromShopify(
  apiToken: string, 
  filteredApiEndpoint: string,
  debug: (message: string) => void
): Promise<ShopifyOrder[]> {
  let shopifyOrders: ShopifyOrder[] = [];
  let nextPageUrl: string | null = null;
  
  // First page of orders - with specific filters already applied
  debug("Fetching first page of orders with timeout of 3 minutes");
  
  // Wrap the API call in a timeout
  const firstPagePromise = fetchAllShopifyOrdersWithPagination(apiToken, filteredApiEndpoint);
  let firstPageResult;
  
  try {
    firstPageResult = await withTimeout(
      firstPagePromise, 
      IMPORT_TIMEOUT_MS, 
      "First page API fetch"
    );
    shopifyOrders = firstPageResult.orders;
    nextPageUrl = firstPageResult.nextPageUrl;
    debug(`Retrieved ${shopifyOrders.length} orders from first page`);
  } catch (timeoutError) {
    debug(`Timeout error fetching first page: ${timeoutError.message}`);
    throw new Error(`API call timed out after ${IMPORT_TIMEOUT_MS/1000} seconds. Please try again or consider reducing the number of orders by using additional filters.`);
  }
  
  // Continue fetching if there are more pages
  let pageCount = 1;
  
  while (nextPageUrl) {
    pageCount++;
    debug(`Fetching page ${pageCount} from ${nextPageUrl}`);
    
    // Implement retries for pagination
    let retries = 0;
    let pageSuccess = false;
    
    while (!pageSuccess && retries < MAX_RETRIES) {
      try {
        debug(`Page ${pageCount} fetch attempt ${retries + 1} of ${MAX_RETRIES}`);
        
        // Wrap the next page call in a timeout
        const nextPagePromise = fetchNextPage(apiToken, nextPageUrl);
        const nextPageResult = await withTimeout(
          nextPagePromise,
          IMPORT_TIMEOUT_MS,
          `Page ${pageCount} fetch`
        );
        
        shopifyOrders = [...shopifyOrders, ...nextPageResult.orders];
        nextPageUrl = nextPageResult.nextPageUrl;
        
        debug(`Retrieved ${nextPageResult.orders.length} more orders from page ${pageCount}`);
        pageSuccess = true;
      } catch (err) {
        retries++;
        debug(`Error fetching page ${pageCount} (attempt ${retries}): ${err.message}`);
        
        if (retries >= MAX_RETRIES) {
          debug(`Max retries (${MAX_RETRIES}) reached for page ${pageCount}. Continuing with orders fetched so far.`);
          nextPageUrl = null; // Stop pagination
          break;
        }
        
        // Exponential backoff
        const backoffMs = calculateBackoffDelay(retries);
        debug(`Waiting ${backoffMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
    
    // Add a small delay to avoid hitting rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  debug(`Total orders retrieved: ${shopifyOrders.length}`);
  return shopifyOrders;
}

/**
 * Filter orders to ensure only active unfulfilled and partially fulfilled orders are included
 */
export function filterActiveUnfulfilledOrders(shopifyOrders: ShopifyOrder[], debug: (message: string) => void): ShopifyOrder[] {
  debug("Double-checking orders to confirm only ACTIVE unfulfilled and partially fulfilled orders are included");
  
  const filteredOrders = shopifyOrders.filter(order => {
    // Include orders that are unfulfilled or partially_fulfilled
    const status = order.fulfillment_status || "unfulfilled";
    
    // Check if order is cancelled or archived
    const isCancelled = order.cancelled_at != null;
    const isArchived = order.closed_at != null;
    
    // Extra verification that we only include active (not cancelled or archived) 
    // unfulfilled/partially fulfilled orders
    return (status === "unfulfilled" || status === "partially_fulfilled") && 
           !isCancelled && 
           !isArchived;
  });
  
  debug(`After double-check: ${filteredOrders.length} active unfulfilled/partially fulfilled orders out of ${shopifyOrders.length} total orders`);
  return filteredOrders;
}

/**
 * Process orders in batches to avoid timeouts
 */
export async function processOrdersInBatches(
  orders: ShopifyOrder[], 
  importOrderFn: (order: ShopifyOrder, orderId: string, orderNumber: string, debug: (message: string) => void) => Promise<boolean>,
  debug: (message: string) => void
): Promise<number> {
  let importedCount = 0;
  const batchSize = 10; // Process 10 orders at a time
  
  debug(`Processing orders in smaller batches of ${batchSize} to avoid timeouts`);
  
  for (let i = 0; i < orders.length; i += batchSize) {
    const orderBatch = orders.slice(i, i + batchSize);
    debug(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(orders.length/batchSize)} (${orderBatch.length} orders)`);
    
    for (const shopifyOrder of orderBatch) {
      const orderNumber = shopifyOrder.name || "Unknown";
      const orderId = shopifyOrder.id;
      const orderStatus = shopifyOrder.fulfillment_status || "unfulfilled";
      
      // Log line items count for debugging
      const lineItemsCount = shopifyOrder.line_items?.length || 0;
      debug(`Processing order: ${orderId} (${orderNumber}) - Status: ${orderStatus} - Has ${lineItemsCount} line items`);

      if (!shopifyOrder.line_items || !Array.isArray(shopifyOrder.line_items) || shopifyOrder.line_items.length === 0) {
        debug(`WARNING: Order ${orderId} (${orderNumber}) has no line items or invalid line_items format`);
        debug(`line_items value: ${JSON.stringify(shopifyOrder.line_items)}`);
      }

      // Import order with retry mechanism
      let importSuccess = false;
      let importRetries = 0;
      
      while (!importSuccess && importRetries < 3) {
        try {
          const success = await importOrderFn(shopifyOrder, orderId, orderNumber, debug);
          if (success) {
            importedCount++;
            importSuccess = true;
          } else {
            throw new Error(`Import returned false for order ${orderId}`);
          }
        } catch (importError) {
          importRetries++;
          debug(`Error importing order ${orderId} (attempt ${importRetries}): ${importError.message}`);
          
          if (importRetries >= 3) {
            debug(`Failed to import order ${orderId} after 3 attempts. Continuing with next order.`);
            break;
          }
          
          // Short backoff before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // Add a small delay between batches to avoid database contention
    debug(`Batch ${Math.floor(i/batchSize) + 1} completed. Pausing briefly before next batch.`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return importedCount;
}

/**
 * Build filtered API endpoint URL for Shopify
 */
export function buildFilteredShopifyEndpoint(
  baseEndpoint: string, 
  filters: Record<string, string>,
  debug: (message: string) => void
): string {
  debug(`Base Shopify API endpoint: ${baseEndpoint}`);
  
  // Modify the endpoint URL to specifically filter for open orders with unfulfilled or partial status
  const url = new URL(baseEndpoint);
  
  // Add specific filters from request or use defaults
  url.searchParams.set('status', filters.status || 'open'); // Only get open (active) orders
  url.searchParams.set('fulfillment_status', filters.fulfillment_status || 'unfulfilled,partial'); // Only unfulfilled or partially fulfilled
  url.searchParams.set('limit', '50'); // Reduce page size to avoid timeouts
  
  const filteredApiEndpoint = url.toString();
  debug(`Using filtered Shopify API endpoint: ${filteredApiEndpoint}`);
  
  return filteredApiEndpoint;
}
