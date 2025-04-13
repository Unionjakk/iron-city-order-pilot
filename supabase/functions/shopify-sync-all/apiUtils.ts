
import { MAX_API_RETRIES, calculateBackoffDelay } from "./shopifyApi.ts";

/**
 * Handle API response with retries and error handling
 */
export async function handleApiResponse(
  response: Response, 
  apiToken: string,
  apiEndpoint: string,
  retryFn: Function
): Promise<void> {
  // Check for rate limiting
  if (response.status === 429) {
    console.log("Rate limited by Shopify API, retrying with backoff");
    
    // Get retry delay from headers if available
    const retryAfter = response.headers.get("Retry-After");
    const delayMs = retryAfter ? parseInt(retryAfter) * 1000 : calculateBackoffDelay(1);
    
    // Wait for the specified time
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    // Retry the request
    return retryFn(apiToken, apiEndpoint);
  }
  
  // Check for other errors
  if (!response.ok) {
    console.error(`Shopify API error: ${response.status} ${response.statusText}`);
    
    try {
      const errorData = await response.json();
      console.error("Error details:", errorData);
    } catch (e) {
      // If can't parse the error response, just log the status
      console.error("Could not parse error response");
    }
    
    throw new Error(`Shopify API returned error: ${response.status} ${response.statusText}`);
  }
}
