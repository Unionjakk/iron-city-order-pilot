
import { ShopifyOrder, ShopifyLineItem, corsHeaders } from "./types.ts";

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
    const url = `${baseEndpoint}/orders/${orderId}.json?fields=id,name,created_at,customer,line_items,shipping_address,note,fulfillment_status,fulfillments,locations`;
    
    debug(`Fetching from Shopify API: ${url}`);
    
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
        throw new Error("Access forbidden. Your API token might not have the necessary permissions (read_locations and read_assigned_fulfillment_orders).");
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
      debug("Unexpected Shopify API response format: " + JSON.stringify(data));
      throw new Error("Received unexpected data format from Shopify API");
    }
    
    // Process the order to extract line items with location information
    const order = data.order;
    debug(`Processing order data: ${order.name} (#${order.order_number})`);
    
    // Process line items to extract location information if available
    if (order.line_items && Array.isArray(order.line_items)) {
      debug(`Found ${order.line_items.length} line items in the order`);
      
      order.line_items = order.line_items.map((item: any) => {
        // Extract location information from the line item
        if (item.origin_location) {
          debug(`Item ${item.id} has origin_location: ${JSON.stringify(item.origin_location)}`);
          item.location_id = item.origin_location.id;
          item.location_name = item.origin_location.name;
        } else {
          debug(`Item ${item.id} has no origin_location data`);
        }

        // For fulfillment items check if they have location info
        if (order.fulfillments && Array.isArray(order.fulfillments)) {
          for (const fulfillment of order.fulfillments) {
            if (fulfillment.line_items && Array.isArray(fulfillment.line_items)) {
              const fulfillmentLineItem = fulfillment.line_items.find((l: any) => String(l.id) === String(item.id));
              
              if (fulfillmentLineItem && fulfillment.location_id) {
                debug(`Item ${item.id} found in fulfillment with location_id: ${fulfillment.location_id}`);
                item.location_id = fulfillment.location_id;
                
                // Try to get location name if available
                if (fulfillment.location) {
                  item.location_name = fulfillment.location.name;
                }
              }
            }
          }
        }
        
        return item as ShopifyLineItem;
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
 * Fetches a specific line item from Shopify by order ID and line item ID
 */
export async function fetchSingleLineItem(
  apiToken: string,
  orderId: string,
  lineItemId: string,
  debug: (message: string) => void
): Promise<ShopifyLineItem | null> {
  try {
    debug(`Fetching single line item: Order ID ${orderId}, Line Item ID ${lineItemId}`);
    
    // Get the full order
    const order = await fetchOrdersWithLineItems(apiToken, orderId, debug);
    
    if (!order.line_items || !Array.isArray(order.line_items)) {
      debug(`No line items found in order ${orderId}`);
      return null;
    }
    
    // Find the specific line item
    const lineItem = order.line_items.find(item => String(item.id) === String(lineItemId));
    
    if (!lineItem) {
      debug(`Line item ${lineItemId} not found in order ${orderId}`);
      return null;
    }
    
    debug(`Successfully found line item ${lineItemId} in order ${orderId}`);
    debug(`Line item details: ${JSON.stringify(lineItem)}`);
    
    return lineItem;
  } catch (error: any) {
    debug(`Exception in fetchSingleLineItem: ${error.message}`);
    throw error;
  }
}
