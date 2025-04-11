
import { ShopifyOrder } from "./types.ts";
import { processOrder } from "./orderProcessingUtils.ts";
import { handleApiResponse } from "./apiUtils.ts";
import { extractPaginationInfo } from "./paginationUtils.ts";

/**
 * Fetches next page of orders
 */
export async function fetchNextPage(
  apiToken: string, 
  nextPageUrl: string
): Promise<{ orders: ShopifyOrder[]; nextPageUrl: string | null }> {
  try {
    console.log(`Fetching next page from: ${nextPageUrl}`);
    
    const response = await fetch(nextPageUrl, {
      headers: {
        "X-Shopify-Access-Token": apiToken,
        "Content-Type": "application/json",
      },
    });

    // Log detailed response information
    console.log(`Response status: ${response.status} ${response.statusText}`);

    // Handle API response (errors, rate limiting, etc.)
    await handleApiResponse(response, apiToken, nextPageUrl, fetchNextPage);

    const data = await response.json();
    if (!data.orders || !Array.isArray(data.orders)) {
      console.error("Unexpected Shopify API response format:", data);
      throw new Error("Received unexpected data format from Shopify API");
    }
    
    // Process orders and extract relevant information
    const processedOrders = data.orders.map(order => processOrder(order, data));
    
    // Get pagination information
    const { nextPageUrl: newNextPageUrl } = extractPaginationInfo(response);
    
    console.log(`Fetched ${processedOrders.length} orders, next page URL: ${newNextPageUrl || 'none'}`);
    
    return { 
      orders: processedOrders, 
      nextPageUrl: newNextPageUrl 
    };
  } catch (error) {
    console.error(`Exception in fetchNextPage:`, error);
    throw error;
  }
}
