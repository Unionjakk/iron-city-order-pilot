
/**
 * Extract pagination information from Shopify response headers
 */
export function extractPaginationInfo(response: Response): { nextPageUrl: string | null } {
  const linkHeader = response.headers.get('Link');
  
  if (!linkHeader) {
    return { nextPageUrl: null };
  }
  
  // Parse the Link header to extract the next page URL
  const links = linkHeader.split(',');
  let nextPageUrl: string | null = null;
  
  for (const link of links) {
    const match = link.match(/<([^>]+)>;\s*rel="next"/);
    if (match) {
      nextPageUrl = match[1];
      break;
    }
  }
  
  return { nextPageUrl };
}
