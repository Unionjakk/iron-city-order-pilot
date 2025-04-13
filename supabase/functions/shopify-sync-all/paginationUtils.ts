
/**
 * Extract pagination information from Shopify API response headers
 */
export function extractPaginationInfo(response: Response): { nextPageUrl: string | null } {
  // Check for Link header which contains pagination info
  const linkHeader = response.headers.get("Link");
  
  if (!linkHeader) {
    return { nextPageUrl: null };
  }

  // Parse Link header to extract next page URL
  const links = linkHeader.split(",");
  let nextPageUrl: string | null = null;

  for (const link of links) {
    const match = link.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (match && match[2] === "next") {
      nextPageUrl = match[1];
      break;
    }
  }

  return { nextPageUrl };
}
