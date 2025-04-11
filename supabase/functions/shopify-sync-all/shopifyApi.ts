import { PaginatedOrdersResponse, ShopifyOrder } from "./types.ts";

// Fetch unfulfilled and partially fulfilled Shopify orders with pagination
export async function fetchAllShopifyOrdersWithPagination(
  apiToken: string, 
  apiEndpoint: string
): Promise<PaginatedOrdersResponse> {
  try {
    // Parse the base URL
    const baseUrl = new URL(apiEndpoint);
    
    // First fetch unfulfilled orders
    baseUrl.searchParams.set('status', 'open');
    baseUrl.searchParams.set('fulfillment_status', 'unfulfilled');
    
    // Set limit to maximum allowed
    baseUrl.searchParams.set('limit', '250'); // Shopify API max
    
    // Set fields
    if (!baseUrl.searchParams.has('fields')) {
      baseUrl.searchParams.set('fields', 'id,name,created_at,customer,line_items,shipping_address,note,fulfillment_status,location_id');
    }
    
    console.log(`Fetching unfulfilled orders from: ${baseUrl.toString()}`);
    
    // Fetch unfulfilled orders
    const unfulfilledResponse = await fetch(baseUrl.toString(), {
      headers: {
        "X-Shopify-Access-Token": apiToken,
        "Content-Type": "application/json",
      },
    });

    // Log detailed response information
    console.log(`Unfulfilled orders response status: ${unfulfilledResponse.status} ${unfulfilledResponse.statusText}`);
    console.log(`Response headers: ${JSON.stringify(Object.fromEntries(unfulfilledResponse.headers.entries()))}`);

    if (!unfulfilledResponse.ok) {
      const errorText = await unfulfilledResponse.text();
      console.error(`Shopify API error (${unfulfilledResponse.status}):`, errorText);
      
      if (unfulfilledResponse.status === 401) {
        throw new Error("Authentication failed. Your Shopify API token might be invalid or expired.");
      } else if (unfulfilledResponse.status === 404) {
        throw new Error("Store not found. Please verify your Shopify store URL is correct and the app is installed.");
      } else if (unfulfilledResponse.status === 403) {
        throw new Error("Access forbidden. Your API token might not have the necessary permissions.");
      } else if (unfulfilledResponse.status === 429) {
        console.warn("Rate limit hit, waiting and retrying...");
        // Wait for 2 seconds and retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchAllShopifyOrdersWithPagination(apiToken, apiEndpoint);
      } else {
        throw new Error(`Shopify API error: ${unfulfilledResponse.status} - ${errorText || "Unknown error"}`);
      }
    }

    const unfulfilledData = await unfulfilledResponse.json();
    console.log(`Received unfulfilled orders data structure: ${Object.keys(unfulfilledData).join(', ')}`);
    
    if (!unfulfilledData.orders || !Array.isArray(unfulfilledData.orders)) {
      console.error("Unexpected Shopify API response format:", unfulfilledData);
      throw new Error("Received unexpected data format from Shopify API");
    }
    
    // Get the Link header for pagination of unfulfilled orders
    const unfulfilledLinkHeader = unfulfilledResponse.headers.get('Link');
    let nextPageUrl: string | null = null;
    
    if (unfulfilledLinkHeader) {
      console.log(`Unfulfilled orders Link header: ${unfulfilledLinkHeader}`);
      // Parse the Link header to find the next page URL
      const links = unfulfilledLinkHeader.split(',');
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
    
    console.log(`Fetched ${unfulfilledData.orders.length} unfulfilled orders, next page URL: ${nextPageUrl || 'none'}`);
    
    // Now fetch partially fulfilled orders
    const partialUrl = new URL(apiEndpoint);
    partialUrl.searchParams.set('status', 'open');
    partialUrl.searchParams.set('fulfillment_status', 'partial');
    partialUrl.searchParams.set('limit', '250');
    
    if (!partialUrl.searchParams.has('fields')) {
      partialUrl.searchParams.set('fields', 'id,name,created_at,customer,line_items,shipping_address,note,fulfillment_status,location_id');
    }
    
    console.log(`Fetching partially fulfilled orders from: ${partialUrl.toString()}`);
    
    // Fetch partially fulfilled orders
    const partialResponse = await fetch(partialUrl.toString(), {
      headers: {
        "X-Shopify-Access-Token": apiToken,
        "Content-Type": "application/json",
      },
    });

    // Log detailed response information
    console.log(`Partially fulfilled orders response status: ${partialResponse.status} ${partialResponse.statusText}`);
    
    if (!partialResponse.ok) {
      const errorText = await partialResponse.text();
      console.error(`Shopify API error (${partialResponse.status}):`, errorText);
      
      // Still return the unfulfilled orders if partial fetch fails
      if (partialResponse.status === 429) {
        console.warn("Rate limit hit for partial orders, waiting and retrying...");
        // Wait for 2 seconds and retry just the partial part
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simplified retry just for the partial orders
        const retryResponse = await fetch(partialUrl.toString(), {
          headers: {
            "X-Shopify-Access-Token": apiToken,
            "Content-Type": "application/json",
          },
        });
        
        if (!retryResponse.ok) {
          console.error("Retry for partial orders failed, proceeding with unfulfilled orders only");
          return { 
            orders: unfulfilledData.orders, 
            nextPageUrl 
          };
        }
        
        const retryData = await retryResponse.json();
        const combinedOrders = [...unfulfilledData.orders, ...(retryData.orders || [])];
        console.log(`After retry: Combined ${unfulfilledData.orders.length} unfulfilled and ${retryData.orders?.length || 0} partially fulfilled orders`);
        
        return { 
          orders: combinedOrders, 
          nextPageUrl 
        };
      } else {
        console.warn(`Error fetching partially fulfilled orders: ${errorText}. Proceeding with unfulfilled orders only.`);
        return { 
          orders: unfulfilledData.orders, 
          nextPageUrl 
        };
      }
    }

    const partialData = await partialResponse.json();
    
    if (!partialData.orders || !Array.isArray(partialData.orders)) {
      console.warn("Unexpected format for partially fulfilled orders, proceeding with unfulfilled only");
      return { 
        orders: unfulfilledData.orders, 
        nextPageUrl 
      };
    }
    
    // Combine both sets of orders
    const combinedOrders = [...unfulfilledData.orders, ...partialData.orders];
    console.log(`Combined ${unfulfilledData.orders.length} unfulfilled and ${partialData.orders.length} partially fulfilled orders`);
    
    // We'll keep the next page URL from the unfulfilled orders query
    // as we're handling the partial orders separately
    
    return { 
      orders: combinedOrders, 
      nextPageUrl 
    };
  } catch (error) {
    console.error(`Exception in fetchAllShopifyOrdersWithPagination:`, error);
    throw error;
  }
}

// Function to fetch subsequent pages using the Link header URLs
export async function fetchNextPage(
  apiToken: string, 
  nextPageUrl: string
): Promise<PaginatedOrdersResponse> {
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
    
    console.log(`Fetched ${data.orders.length} orders, next page URL: ${newNextPageUrl || 'none'}`);
    
    return { 
      orders: data.orders, 
      nextPageUrl: newNextPageUrl 
    };
  } catch (error) {
    console.error(`Exception in fetchNextPage:`, error);
    throw error;
  }
}
