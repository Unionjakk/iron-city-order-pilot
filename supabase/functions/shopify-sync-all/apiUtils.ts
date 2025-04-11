
/**
 * Handle Shopify API response
 */
export async function handleApiResponse(
  response: Response, 
  apiToken: string, 
  url: string,
  retryFunction: Function
): Promise<void> {
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
      await handleRateLimiting(apiToken, url, retryFunction);
    } else {
      throw new Error(`Shopify API error: ${response.status} - ${errorText || "Unknown error"}`);
    }
  }
}

/**
 * Handle rate limiting by waiting and retrying
 */
export async function handleRateLimiting(
  apiToken: string, 
  url: string,
  retryFunction: Function
): Promise<any> {
  console.warn("Rate limit hit, waiting and retrying...");
  // Wait for 2 seconds and retry
  await new Promise(resolve => setTimeout(resolve, 2000));
  return retryFunction(apiToken, url);
}
