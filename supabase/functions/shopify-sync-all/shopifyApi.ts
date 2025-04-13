
import { fetchAllShopifyOrdersWithPagination } from "./shopifyOrdersApi.ts";
import { fetchNextPage } from "./shopifyPaginationApi.ts";

// Constants for API retries
export const MAX_API_RETRIES = 5;
export const BASE_RETRY_DELAY_MS = 1000;

// Helper function for exponential backoff
export const calculateBackoffDelay = (attempt: number): number => {
  return BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
};

export {
  fetchAllShopifyOrdersWithPagination,
  fetchNextPage
};
