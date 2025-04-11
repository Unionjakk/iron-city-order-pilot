
import { ShopifyOrder, ShopifyLineItem } from "./types.ts";
import { processOrder } from "./orderProcessingUtils.ts";
import { handleApiResponse, handleRateLimiting } from "./apiUtils.ts";
import { extractPaginationInfo } from "./paginationUtils.ts";

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
    
    const fullUrl = url.toString();
    console.log(`API URL: ${fullUrl}`);
    
    console.log(`Fetching orders from: ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
      headers: {
        "X-Shopify-Access-Token": apiToken,
        "Content-Type": "application/json",
      },
    });

    // Log detailed response information
    console.log(`Response status: ${response.status} ${response.statusText}`);
    console.log(`Response headers: ${JSON.stringify(Object.fromEntries([...response.headers]))}`);
    
    // Handle API response (errors, rate limiting, etc.)
    await handleApiResponse(response, apiToken, fullUrl, fetchAllShopifyOrdersWithPagination);

    const data = await response.json();
    
    // Log the raw response data for debugging
    console.log(`RAW JSON RESPONSE: ${JSON.stringify(data)}`);
    
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

/**
 * Fetches the next page of orders using the pagination URL
 */
export async function fetchNextPage(
  apiToken: string,
  nextPageUrl: string
): Promise<{ orders: ShopifyOrder[]; nextPageUrl: string | null }> {
  try {
    console.log(`API URL: ${nextPageUrl}`);
    console.log(`Fetching next page of orders from: ${nextPageUrl}`);
    
    const response = await fetch(nextPageUrl, {
      headers: {
        "X-Shopify-Access-Token": apiToken,
        "Content-Type": "application/json",
      },
    });

    // Log detailed response information
    console.log(`Response status: ${response.status} ${response.statusText}`);
    console.log(`Response headers: ${JSON.stringify(Object.fromEntries([...response.headers]))}`);
    
    // Handle API response (errors, rate limiting, etc.)
    await handleApiResponse(response, apiToken, nextPageUrl, fetchNextPage);

    const data = await response.json();
    
    // Log the raw response data for debugging
    console.log(`RAW JSON RESPONSE: ${JSON.stringify(data)}`);
    
    if (!data.orders || !Array.isArray(data.orders)) {
      console.error("Unexpected Shopify API response format:", data);
      throw new Error("Received unexpected data format from Shopify API");
    }
    
    // Process orders and extract relevant information
    const processedOrders = data.orders.map(order => processOrder(order, data));
    
    // Get pagination information
    const { nextPageUrl: newNextPageUrl } = extractPaginationInfo(response);
    
    console.log(`Fetched ${processedOrders.length} more orders, next page URL: ${newNextPageUrl || 'none'}`);
    
    return { 
      orders: processedOrders, 
      nextPageUrl: newNextPageUrl 
    };
  } catch (error) {
    console.error(`Exception in fetchNextPage:`, error);
    throw error;
  }
}
