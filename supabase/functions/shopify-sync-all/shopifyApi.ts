
import { ShopifyOrder } from "./types.ts";

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
      url.searchParams.set('fields', 'id,name,created_at,customer,line_items,shipping_address,note,fulfillment_status,location_id');
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
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Shopify API error (${response.status}):`, errorText);
      
      if (response.status === 401) {
        throw new Error("Authentication failed. Your Shopify API token might be invalid or expired.");
      } else if (response.status === 404) {
        throw new Error("Store not found. Please verify your Shopify store URL is correct and the app is installed.");
      } else if (response.status === 403) {
        throw new Error("Access forbidden. Your API token might not have the necessary permissions.");
      } else if (response.status === 429) {
        console.warn("Rate limit hit, waiting and retrying...");
        // Wait for 2 seconds and retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchAllShopifyOrdersWithPagination(apiToken, apiEndpoint);
      } else {
        throw new Error(`Shopify API error: ${response.status} - ${errorText || "Unknown error"}`);
      }
    }

    const data = await response.json();
    
    if (!data.orders || !Array.isArray(data.orders)) {
      console.error("Unexpected Shopify API response format:", data);
      throw new Error("Received unexpected data format from Shopify API");
    }
    
    // Process the orders to extract location_name from the locations field if present
    const processedOrders = data.orders.map((order: any) => {
      // Try to find location_name if we have location_id
      if (order.location_id && data.locations && Array.isArray(data.locations)) {
        const location = data.locations.find((loc: any) => loc.id === order.location_id);
        if (location) {
          order.location_name = location.name;
        }
      }
      return order;
    });
    
    // Get the Link header for pagination
    const linkHeader = response.headers.get('Link');
    let nextPageUrl: string | null = null;
    
    if (linkHeader) {
      console.log(`Link header: ${linkHeader}`);
      // Parse the Link header to find the next page URL
      const links = linkHeader.split(',');
      for (const link of links) {
        const parts = link.split(';');
        if (parts.length === 2 && parts[1].trim().includes('rel="next"')) {
          // Extract URL from <url> format
          const urlMatch = parts[0].trim().match(/<(.+)>/);
          if (urlMatch && urlMatch[1]) {
            nextPageUrl = urlMatch[1];
            break;
          }
        }
      }
    }
    
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Shopify API error (${response.status}):`, errorText);
      
      if (response.status === 429) {
        console.warn("Rate limit hit, waiting and retrying...");
        // Wait for 2 seconds and retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchNextPage(apiToken, nextPageUrl);
      } else {
        throw new Error(`Shopify API error: ${response.status} - ${errorText || "Unknown error"}`);
      }
    }

    const data = await response.json();
    if (!data.orders || !Array.isArray(data.orders)) {
      console.error("Unexpected Shopify API response format:", data);
      throw new Error("Received unexpected data format from Shopify API");
    }
    
    // Process the orders to extract location_name from the locations field if present
    const processedOrders = data.orders.map((order: any) => {
      // Try to find location_name if we have location_id
      if (order.location_id && data.locations && Array.isArray(data.locations)) {
        const location = data.locations.find((loc: any) => loc.id === order.location_id);
        if (location) {
          order.location_name = location.name;
        }
      }
      return order;
    });
    
    // Get the Link header for pagination
    const linkHeader = response.headers.get('Link');
    let newNextPageUrl: string | null = null;
    
    if (linkHeader) {
      // Parse the Link header to find the next page URL
      const links = linkHeader.split(',');
      for (const link of links) {
        const parts = link.split(';');
        if (parts.length === 2 && parts[1].trim().includes('rel="next"')) {
          // Extract URL from <url> format
          const urlMatch = parts[0].trim().match(/<(.+)>/);
          if (urlMatch && urlMatch[1]) {
            newNextPageUrl = urlMatch[1];
            break;
          }
        }
      }
    }
    
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
