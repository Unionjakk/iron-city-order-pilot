
// Import core utilities from Deno standard library
import { filterActiveUnfulfilledOrders } from "./filterUtils.ts";

/**
 * Builds a filtered Shopify API endpoint with the provided filters
 */
export function buildFilteredShopifyEndpoint(
  baseEndpoint: string,
  filters: Record<string, string | undefined>,
  debug: (message: string) => void
): string {
  // Start with the base endpoint
  let filteredEndpoint = baseEndpoint;
  
  // Add query parameters
  const queryParams: string[] = [];
  
  // Extract existing query parameters if any
  const [endpointBase, existingParams] = baseEndpoint.split('?');
  if (existingParams) {
    queryParams.push(existingParams);
  }
  
  // Add filters as query parameters
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) {
      queryParams.push(`${key}=${encodeURIComponent(value)}`);
    }
  }
  
  // Add parameters to get complete order data
  if (!queryParams.some(param => param.startsWith('fields='))) {
    // Request all fields we need explicitly to ensure we get complete data
    const fields = [
      "id", "order_number", "name", "created_at", "fulfillment_status", 
      "line_items", "customer", "shipping_address", "note", "email", "phone"
    ].join(',');
    
    queryParams.push(`fields=${encodeURIComponent(fields)}`);
  }
  
  // Add limits parameter for pagination if not already present
  if (!queryParams.some(param => param.startsWith('limit='))) {
    queryParams.push('limit=50'); // 50 is a reasonable batch size
  }
  
  // Construct the final endpoint
  filteredEndpoint = `${endpointBase}${queryParams.length > 0 ? '?' + queryParams.join('&') : ''}`;
  
  debug(`Built filtered endpoint: ${filteredEndpoint}`);
  return filteredEndpoint;
}

/**
 * Imports orders from Shopify with proper pagination
 */
export async function importOrdersFromShopify(
  apiToken: string,
  apiEndpoint: string,
  debug: (message: string) => void
): Promise<any[]> {
  debug("Starting importOrdersFromShopify function...");
  
  let allOrders: any[] = [];
  let nextLink = apiEndpoint;
  let pageCount = 0;
  const maxPages = 50; // Safety limit
  
  while (nextLink && pageCount < maxPages) {
    debug(`Fetching page ${pageCount + 1} from ${nextLink}`);
    
    try {
      const response = await fetch(nextLink, {
        headers: {
          'X-Shopify-Access-Token': apiToken,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        debug(`API Error (${response.status}): ${errorText}`);
        throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.orders || !Array.isArray(data.orders)) {
        debug(`Invalid response format: ${JSON.stringify(data)}`);
        throw new Error("Invalid response format from Shopify API");
      }
      
      // Log the first order for debugging if this is the first page
      if (pageCount === 0 && data.orders.length > 0) {
        debug(`Sample first order data: ${JSON.stringify(data.orders[0])}`);
        
        // Log specific fields we're interested in
        const firstOrder = data.orders[0];
        debug(`First order customer: ${JSON.stringify(firstOrder.customer || 'missing')}`);
        debug(`First order shipping_address: ${JSON.stringify(firstOrder.shipping_address || 'missing')}`);
        debug(`First order line_items count: ${firstOrder.line_items?.length || 0}`);
      }
      
      const pageOrders = data.orders;
      debug(`Received ${pageOrders.length} orders from Shopify API`);
      
      // Add this page's orders to our collection
      allOrders = [...allOrders, ...pageOrders];
      
      // Check for next page in Link header
      const linkHeader = response.headers.get('Link');
      if (linkHeader) {
        debug(`Link header: ${linkHeader}`);
        const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
        nextLink = nextMatch ? nextMatch[1] : null;
      } else {
        nextLink = null;
      }
      
      pageCount++;
      debug(`Fetched page ${pageCount}. Current order count: ${allOrders.length}`);
      
      // If there's a next page, wait a short time to avoid rate limits
      if (nextLink) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      debug(`Error fetching orders from Shopify: ${error.message}`);
      throw error;
    }
  }
  
  if (pageCount >= maxPages) {
    debug(`Reached maximum number of pages (${maxPages}). There may be more orders.`);
  }
  
  debug(`Total orders fetched from Shopify: ${allOrders.length}`);
  return allOrders;
}

/**
 * Process orders in batches to avoid timeouts
 */
export async function processOrdersInBatches(
  orders: any[],
  processOrderFn: (order: any, orderId: string, orderNumber: string, debug: (message: string) => void) => Promise<boolean>,
  debug: (message: string) => void
): Promise<number> {
  const batchSize = 5; // Small batch size to avoid timeouts
  let successCount = 0;
  let failCount = 0;
  
  debug(`Processing ${orders.length} orders in batches of ${batchSize}`);
  
  for (let i = 0; i < orders.length; i += batchSize) {
    const batch = orders.slice(i, Math.min(i + batchSize, orders.length));
    debug(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(orders.length/batchSize)} (${batch.length} orders)`);
    
    // Process each order in the batch
    for (const order of batch) {
      try {
        if (!order.id) {
          debug(`Error: Order missing ID: ${JSON.stringify(order)}`);
          failCount++;
          continue;
        }
        
        const orderId = String(order.id);
        const orderNumber = order.order_number || order.name || `unknown-${orderId}`;
        
        // Process this order
        const success = await processOrderFn(order, orderId, orderNumber, debug);
        
        if (success) {
          successCount++;
        } else {
          failCount++;
          debug(`Failed to process order ${orderId} (${orderNumber})`);
        }
      } catch (error) {
        failCount++;
        debug(`Exception processing order: ${error.message}`);
      }
    }
    
    // Add a small delay between batches
    if (i + batchSize < orders.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  debug(`Order processing complete. Success: ${successCount}, Failed: ${failCount}`);
  return successCount;
}
