
/**
 * Handle Shopify API response, including error checking and rate limiting
 */
export async function handleApiResponse(
  response: Response, 
  apiToken: string, 
  apiEndpoint: string,
  retryFn: (apiToken: string, apiEndpoint: string) => Promise<any>
): Promise<void> {
  // Check if the response is in the rate limiting range
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After') || '5';
    console.log(`Rate limited by Shopify API. Retrying after ${retryAfter} seconds`);
    
    // Wait for the specified time and retry
    await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000));
    return await retryFn(apiToken, apiEndpoint);
  }
  
  // Handle other error responses
  if (!response.ok) {
    const body = await response.text();
    console.error(`Shopify API error: Status ${response.status}`);
    console.error(`Response body: ${body}`);
    
    // Create a more helpful error message
    let errorMessage = `Shopify API error: ${response.status} ${response.statusText}`;
    
    try {
      // Try to extract specific error messages from the body
      const errorData = JSON.parse(body);
      if (errorData.errors) {
        errorMessage += ` - ${JSON.stringify(errorData.errors)}`;
      }
    } catch (e) {
      // If the body isn't JSON, just append it to the error
      errorMessage += ` - ${body}`;
    }
    
    throw new Error(errorMessage);
  }
}
