
/**
 * Extract pagination information from Shopify API response
 */
export function extractPaginationInfo(response: Response): { nextPageUrl: string | null } {
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
  
  return { nextPageUrl };
}
