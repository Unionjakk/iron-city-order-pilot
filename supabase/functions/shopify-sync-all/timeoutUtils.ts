
/**
 * Utilities for handling timeouts in API operations
 */

// Constants for timeout handling
export const IMPORT_TIMEOUT_MS = 180000; // 3 minutes timeout for import operations
export const MAX_RETRIES = 5; // Maximum number of retries for API calls
export const INITIAL_BACKOFF_MS = 2000; // Initial backoff time in milliseconds

/**
 * Helper function to implement timeout for promises
 */
export const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> => {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error(`${operationName} operation timed out after ${timeoutMs/1000} seconds`)), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
};

/**
 * Exponential backoff delay calculator
 */
export const calculateBackoffDelay = (attempt: number): number => {
  return INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
};
