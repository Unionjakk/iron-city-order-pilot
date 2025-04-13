
/**
 * Constants and utilities for Shopify API
 */

// Maximum number of retries for API requests
export const MAX_API_RETRIES = 3;

/**
 * Calculate delay for exponential backoff based on retry number
 */
export function calculateBackoffDelay(retryCount: number): number {
  // Base delay of 1000ms with exponential increase
  return Math.min(1000 * Math.pow(2, retryCount), 30000);
}

/**
 * Normalize a Shopify API endpoint URL
 */
export function normalizeApiEndpoint(endpoint: string): string {
  // Ensure endpoint ends with .json
  if (!endpoint.endsWith('.json')) {
    endpoint = `${endpoint}.json`;
  }
  
  return endpoint;
}
