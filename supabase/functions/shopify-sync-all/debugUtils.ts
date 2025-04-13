
/**
 * Debug utility for consistent logging
 */
export function debug(message: string): void {
  // Add timestamp to message
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

/**
 * Debug utility for logging objects with proper formatting
 */
export function debugObject(label: string, obj: any): void {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${label}: ${JSON.stringify(obj, null, 2)}`);
  } catch (e) {
    console.log(`[${new Date().toISOString()}] Failed to stringify object: ${e.message}`);
  }
}

/**
 * Log an error with stack trace if available
 */
export function logError(label: string, error: any): void {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR - ${label}: ${error.message}`);
  if (error.stack) {
    console.error(`[${timestamp}] STACK: ${error.stack}`);
  }
}
