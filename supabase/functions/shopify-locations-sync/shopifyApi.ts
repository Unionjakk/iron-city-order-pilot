
import { ShopifyOrder, ShopifyLineItem } from "./types.ts";

/**
 * Fetches a specific order with line items from Shopify
 */
export async function fetchOrdersWithLineItems(
  apiToken: string,
  orderId: string,
  debug: (message: string) => void
): Promise<ShopifyOrder> {
  try {
    // Get the base API endpoint
    const baseEndpoint = "https://opus-harley-davidson.myshopify.com/admin/api/2023-07";
    const url = `${baseEndpoint}/orders/${orderId}.json?fields=id,name,created_at,customer,line_items,shipping_address,note,fulfillment_status,fulfillments`;
    
    debug(`Fetching from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": apiToken,
        "Content-Type": "application/json",
      },
    });

    // Log response information
    debug(`Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      debug(`Shopify API error (${response.status}): ${errorText}`);
      
      if (response.status === 401) {
        throw new Error("Authentication failed. Your Shopify API token might be invalid or expired.");
      } else if (response.status === 404) {
        throw new Error(`Order ${orderId} not found in Shopify.`);
      } else if (response.status === 403) {
        throw new Error("Access forbidden. Your API token might not have the necessary permissions.");
      } else if (response.status === 429) {
        debug("Rate limit hit, waiting and retrying...");
        // Wait for 2 seconds and retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchOrdersWithLineItems(apiToken, orderId, debug);
      } else {
        throw new Error(`Shopify API error: ${response.status} - ${errorText || "Unknown error"}`);
      }
    }

    const data = await response.json();
    
    if (!data.order) {
      debug("Unexpected Shopify API response format:", JSON.stringify(data));
      throw new Error("Received unexpected data format from Shopify API");
    }
    
    // Process the order to extract line items with location information
    const order = data.order;
    
    // Debug full order for troubleshooting
    debug(`Full order data for ${orderId}: ${JSON.stringify(order.line_items)}`);
    
    // Process line items to extract location information if available
    if (order.line_items && Array.isArray(order.line_items)) {
      order.line_items = order.line_items.map((item: any) => {
        // Debug each line item
        debug(`Processing line item ${item.id} with name ${item.name}`);
        
        // Create a properly structured line item with location info
        const lineItem: ShopifyLineItem = {
          id: item.id.toString(),
          title: item.title || item.name || "Unknown Item",
          quantity: item.quantity,
          price: item.price,
          sku: item.sku,
          product_id: item.product_id?.toString(),
          variant_id: item.variant_id?.toString(),
          location_id: null,
          location_name: null
        };

        // Extract location information from the line item
        if (item.origin_location) {
          debug(`Found origin_location for line item ${item.id}: ${JSON.stringify(item.origin_location)}`);
          lineItem.location_id = item.origin_location.id?.toString();
          lineItem.location_name = item.origin_location.name;
        }

        // For fulfillment items check if they have location info
        if (order.fulfillments && Array.isArray(order.fulfillments)) {
          const fulfillment = order.fulfillments.find((f: any) => 
            f.line_items && f.line_items.some((l: any) => l.id.toString() === item.id.toString())
          );
          
          if (fulfillment && fulfillment.location_id) {
            debug(`Found fulfillment location for line item ${item.id}: ${fulfillment.location_id}`);
            lineItem.location_id = fulfillment.location_id.toString();
            
            // Try to get location name from the fulfillment if available
            if (fulfillment.location && fulfillment.location.name) {
              lineItem.location_name = fulfillment.location.name;
            }
          }
        }
        
        debug(`Processed line item ${lineItem.id}, location: ${lineItem.location_id || 'none'}`);
        return lineItem;
      });
    }
    
    debug(`Processed order ${orderId} with ${order.line_items?.length || 0} line items`);
    
    return order;
  } catch (error: any) {
    debug(`Exception in fetchOrdersWithLineItems: ${error.message}`);
    throw error;
  }
}

/**
 * Fetches next page of orders
 */
export async function fetchNextPage(
  apiToken: string, 
  nextPageUrl: string,
  debug: (message: string) => void
): Promise<{ orders: ShopifyOrder[]; nextPageUrl: string | null }> {
  try {
    debug(`Fetching next page from: ${nextPageUrl}`);
    
    const response = await fetch(nextPageUrl, {
      headers: {
        "X-Shopify-Access-Token": apiToken,
        "Content-Type": "application/json",
      },
    });

    // Log response information
    debug(`Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      debug(`Shopify API error (${response.status}): ${errorText}`);
      
      if (response.status === 429) {
        debug("Rate limit hit, waiting and retrying...");
        // Wait for 2 seconds and retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchNextPage(apiToken, nextPageUrl, debug);
      } else {
        throw new Error(`Shopify API error: ${response.status} - ${errorText || "Unknown error"}`);
      }
    }

    const data = await response.json();
    if (!data.orders || !Array.isArray(data.orders)) {
      debug("Unexpected Shopify API response format:", JSON.stringify(data));
      throw new Error("Received unexpected data format from Shopify API");
    }
    
    // Process line items to extract location information if available
    const processedOrders = data.orders.map((order: any) => {
      // Process line items to add location information
      if (order.line_items && Array.isArray(order.line_items)) {
        order.line_items = order.line_items.map((item: any) => {
          // Extract location information from the line item
          if (item.origin_location) {
            item.location_id = item.origin_location.id;
            item.location_name = item.origin_location.name;
          }
          
          // For fulfillment items check if they have location info
          if (item.fulfillment_line_item_id && order.fulfillments && Array.isArray(order.fulfillments)) {
            const fulfillment = order.fulfillments.find((f: any) => 
              f.line_items && f.line_items.some((l: any) => l.id === item.fulfillment_line_item_id)
            );
            
            if (fulfillment && fulfillment.location_id) {
              item.location_id = fulfillment.location_id;
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
    
    debug(`Fetched ${processedOrders.length} orders, next page URL: ${newNextPageUrl || 'none'}`);
    
    return { 
      orders: processedOrders, 
      nextPageUrl: newNextPageUrl 
    };
  } catch (error: any) {
    debug(`Exception in fetchNextPage: ${error.message}`);
    throw error;
  }
}
