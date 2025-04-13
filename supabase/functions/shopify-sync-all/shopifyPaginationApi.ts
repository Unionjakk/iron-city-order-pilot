
import { extractPaginationInfo } from "./paginationUtils.ts";

/**
 * Fetch the next page of results using a pagination URL
 */
export async function fetchNextPage(
  apiToken: string, 
  nextPageUrl: string
): Promise<{ orders: any[]; nextPageUrl: string | null }> {
  try {
    console.log(`Fetching next page from: ${nextPageUrl}`);
    
    const response = await fetch(nextPageUrl, {
      headers: {
        "X-Shopify-Access-Token": apiToken,
        "Content-Type": "application/json",
      },
    });
    
    // Check if response is OK
    if (!response.ok) {
      console.error(`Failed to fetch next page: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch next page: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.orders || !Array.isArray(data.orders)) {
      console.error("Unexpected Shopify API response format for pagination:", data);
      throw new Error("Received unexpected data format from Shopify API pagination");
    }
    
    // Get pagination information for the next request
    const { nextPageUrl: newNextPageUrl } = extractPaginationInfo(response);
    
    console.log(`Fetched ${data.orders.length} orders from pagination, next page URL: ${newNextPageUrl || 'none'}`);
    
    return { 
      orders: data.orders, 
      nextPageUrl: newNextPageUrl 
    };
  } catch (error) {
    console.error(`Exception in fetchNextPage:`, error);
    throw error;
  }
}
