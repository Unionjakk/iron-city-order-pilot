
import { ShopifyOrder, ShopifyLineItem } from "./types.ts";
import { processOrder } from "./orderProcessingUtils.ts";
import { handleApiResponse, handleRateLimiting } from "./apiUtils.ts";

/**
 * Fetches all orders from Shopify with pagination
 */
export async function fetchAllShopifyOrdersWithPagination(
  apiToken: string,
  apiEndpoint: string
): Promise<{ orders: ShopifyOrder[]; nextPageUrl: string | null }> {
  try {
    // Parse the base URL and add query parameters
    const url = new URL(apiEndpoint);
    
    // Add query parameters if they don't exist (but don't override existing ones)
    if (!url.searchParams.has('limit')) {
      url.searchParams.set('limit', '250'); // Shopify API max
    }
    
    if (!url.searchParams.has('fields')) {
      url.searchParams.set('fields', 'id,name,created_at,customer,line_items,shipping_address,note,fulfillment_status');
    }
    
    console.log(`Fetching orders from: ${url.toString()}`);
    
    const response = await fetch(url.toString(), {
      headers: {
        "X-Shopify-Access-Token": apiToken,
        "Content-Type": "application/json",
      },
    });

    // Log detailed response information
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    // Handle API response (errors, rate limiting, etc.)
    await handleApiResponse(response, apiToken, url.toString(), fetchAllShopifyOrdersWithPagination);

    const data = await response.json();
    
    if (!data.orders || !Array.isArray(data.orders)) {
      console.error("Unexpected Shopify API response format:", data);
      throw new Error("Received unexpected data format from Shopify API");
    }
    
    // Process orders and extract relevant information
    const processedOrders = data.orders.map(order => processOrder(order, data));
    
    // Get pagination information
    const { nextPageUrl } = extractPaginationInfo(response);
    
    console.log(`Fetched ${processedOrders.length} orders, next page URL: ${nextPageUrl || 'none'}`);
    
    return { 
      orders: processedOrders, 
      nextPageUrl 
    };
  } catch (error) {
    console.error(`Exception in fetchShopifyOrdersWithPagination:`, error);
    throw error;
  }
}
