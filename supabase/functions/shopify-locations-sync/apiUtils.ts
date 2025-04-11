
import { corsHeaders } from "./types.ts";

/**
 * Base URL for Shopify API
 */
export const SHOPIFY_API_BASE_URL = "https://opus-harley-davidson.myshopify.com/admin/api/2023-07";

/**
 * Makes an authenticated request to the Shopify API
 */
export async function makeShopifyApiRequest(
  apiToken: string,
  endpoint: string,
  debug: (message: string) => void
): Promise<any> {
  const url = `${SHOPIFY_API_BASE_URL}${endpoint}`;
  
  debug(`Fetching from Shopify API: ${url}`);
  debug(`Using API token: ${apiToken.substring(0, 4)}...${apiToken.substring(apiToken.length - 4)}`);
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-Shopify-Access-Token": apiToken,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
  });

  // Log response status and headers
  debug(`Response status: ${response.status} ${response.statusText}`);
  debug(`Response headers: ${JSON.stringify(Object.fromEntries([...response.headers]))}`);
  
  if (!response.ok) {
    let errorText = "";
    try {
      // Try to get the response as text
      errorText = await response.text();
      debug(`Shopify API error response body: ${errorText}`);
    } catch (e) {
      debug(`Could not read error response text: ${e.message}`);
    }
    
    if (response.status === 401) {
      throw new Error("Authentication failed. Your Shopify API token might be invalid or expired.");
    } else if (response.status === 404) {
      throw new Error(`Resource not found in Shopify.`);
    } else if (response.status === 403) {
      throw new Error("Access forbidden. Your API token might not have the necessary permissions.");
    } else if (response.status === 429) {
      debug("Rate limit hit, waiting and retrying...");
      // Wait for 2 seconds and retry - this will be handled by the caller
      throw new Error("RATE_LIMIT_HIT");
    } else {
      throw new Error(`Shopify API error: ${response.status} - ${errorText || "Unknown error"}`);
    }
  }

  // Try to parse the JSON response
  try {
    const data = await response.json();
    debug(`Received JSON response from Shopify: ${JSON.stringify(data).substring(0, 200)}...`);
    return data;
  } catch (e) {
    debug(`Error parsing JSON response: ${e.message}`);
    throw new Error(`Failed to parse Shopify API response: ${e.message}`);
  }
}

/**
 * Retry an API call if rate limited
 */
export async function retryOnRateLimit<T>(
  apiCallFn: () => Promise<T>,
  debug: (message: string) => void,
  maxRetries = 3,
  initialDelayMs = 2000
): Promise<T> {
  let retries = 0;
  let delay = initialDelayMs;
  
  while (true) {
    try {
      return await apiCallFn();
    } catch (error) {
      if (error.message === "RATE_LIMIT_HIT" && retries < maxRetries) {
        retries++;
        debug(`Rate limit hit, retry ${retries}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        // Exponential backoff
        delay *= 1.5;
      } else {
        throw error;
      }
    }
  }
}
