
/**
 * Extract pagination information from Shopify API response
 */
export function extractPaginationInfo(response: Response): { 
  nextPageUrl: string | null; 
  previousPageUrl: string | null;
} {
  // Default values
  let nextPageUrl: string | null = null;
  let previousPageUrl: string | null = null;

  // Get Link header which contains pagination info
  const linkHeader = response.headers.get('Link');
  
  if (linkHeader) {
    // Parse Link header for next and previous page URLs
    const links = linkHeader.split(',');
    
    for (const link of links) {
      const [url, rel] = link.split(';').map(part => part.trim());
      
      if (rel.includes('rel="next"')) {
        // Extract URL from <url> format
        nextPageUrl = url.substring(1, url.length - 1);
      } else if (rel.includes('rel="previous"')) {
        previousPageUrl = url.substring(1, url.length - 1);
      }
    }
  }

  return { nextPageUrl, previousPageUrl };
}

/**
 * Helper function to check if there are more pages
 */
export function hasMorePages(response: Response): boolean {
  const { nextPageUrl } = extractPaginationInfo(response);
  return nextPageUrl !== null;
}
