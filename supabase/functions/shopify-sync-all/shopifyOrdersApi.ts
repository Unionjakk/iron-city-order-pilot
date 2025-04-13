
import { ShopifyOrder } from "./types.ts";
import { handleApiResponse } from "./apiUtils.ts";
import { extractPaginationInfo } from "./paginationUtils.ts";
import { processOrder } from "./orderProcessingUtils.ts";

/**
 * Fetches all orders from Shopify with pagination
 */
export async function fetchAllShopifyOrdersWithPagination(
  apiToken: string, 
  apiEndpoint: string
): Promise<{ orders: ShopifyOrder[]; nextPageUrl: string | null }> {
  try {
    console.log(`Fetching orders from: ${apiEndpoint}`);
    
    const response = await fetch(apiEndpoint, {
      headers: {
        "X-Shopify-Access-Token": apiToken,
        "Content-Type": "application/json",
      },
    });

    // Log detailed response information
    console.log(`Response status: ${response.status} ${response.statusText}`);

    // Handle API response (errors, rate limiting, etc.)
    await handleApiResponse(response, apiToken, apiEndpoint, fetchAllShopifyOrdersWithPagination);

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
      nextPageUrl: nextPageUrl 
    };
  } catch (error) {
    console.error(`Exception in fetchAllShopifyOrdersWithPagination:`, error);
    throw error;
  }
}
