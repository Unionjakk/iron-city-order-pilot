
import { ShopifyOrder, ShopifyLineItem } from "./types.ts";

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
    
    // Process line items to extract location information if available and ensure IDs are strings
    const processedOrders = data.orders.map((order: any) => {
      // Ensure order ID is a string
      order.id = String(order.id);
      
      // Process line items to add location information
      if (order.line_items && Array.isArray(order.line_items)) {
        order.line_items = order.line_items.map((item: any) => {
          // Ensure ID is a string
          item.id = String(item.id);
          if (item.product_id) item.product_id = String(item.product_id);
          if (item.variant_id) item.variant_id = String(item.variant_id);
          
          // Extract location information from the line item
          if (item.location_id) {
            item.location_id = String(item.location_id);
            // Try to get location name from the locations array if present in the response
            if (data.locations && Array.isArray(data.locations)) {
              const location = data.locations.find((loc: any) => String(loc.id) === String(item.location_id));
              if (location) {
                item.location_name = location.name;
              }
            }
          }
          
          // For fulfillment items check if they have location info
          if (item.fulfillment_line_item_id && data.fulfillments && Array.isArray(data.fulfillments)) {
            const fulfillment = data.fulfillments.find((f: any) => 
              f.line_items && f.line_items.some((l: any) => String(l.id) === String(item.fulfillment_line_item_id))
            );
            
            if (fulfillment && fulfillment.location_id) {
              item.location_id = String(fulfillment.location_id);
              
              // Try to get location name
              if (data.locations && Array.isArray(data.locations)) {
                const location = data.locations.find((loc: any) => String(loc.id) === String(fulfillment.location_id));
                if (location) {
                  item.location_name = location.name;
                }
              }
            }
          }
          
          return item as ShopifyLineItem;
        });
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
    
    // Process line items to extract location information if available
    const processedOrders = data.orders.map((order: any) => {
      // Ensure order ID is a string
      order.id = String(order.id);
      
      // Process line items to add location information
      if (order.line_items && Array.isArray(order.line_items)) {
        order.line_items = order.line_items.map((item: any) => {
          // Ensure ID is a string
          item.id = String(item.id);
          if (item.product_id) item.product_id = String(item.product_id);
          if (item.variant_id) item.variant_id = String(item.variant_id);
          
          // Extract location information from the line item
          if (item.location_id) {
            item.location_id = String(item.location_id);
            // Try to get location name from the locations array if present in the response
            if (data.locations && Array.isArray(data.locations)) {
              const location = data.locations.find((loc: any) => String(loc.id) === String(item.location_id));
              if (location) {
                item.location_name = location.name;
              }
            }
          }
          
          // For fulfillment items check if they have location info
          if (item.fulfillment_line_item_id && data.fulfillments && Array.isArray(data.fulfillments)) {
            const fulfillment = data.fulfillments.find((f: any) => 
              f.line_items && f.line_items.some((l: any) => String(l.id) === String(item.fulfillment_line_item_id))
            );
            
            if (fulfillment && fulfillment.location_id) {
              item.location_id = String(fulfillment.location_id);
              
              // Try to get location name
              if (data.locations && Array.isArray(data.locations)) {
                const location = data.locations.find((loc: any) => String(loc.id) === String(fulfillment.location_id));
                if (location) {
                  item.location_name = location.name;
                }
              }
            }
          }
          
          return item as ShopifyLineItem;
        });
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
