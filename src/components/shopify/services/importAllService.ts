
import { supabase } from '@/integrations/supabase/client';
import { getTokenFromDatabase } from './cleanupService';

/**
 * Import all orders from Shopify
 */
export const importAllOrders = async (addDebugMessage: (message: string) => void) => {
  try {
    addDebugMessage("Getting API token from database...");
    const token = await getTokenFromDatabase();
    
    if (!token) {
      throw new Error("No API token found in database. Please add your Shopify API token first.");
    }
    
    addDebugMessage("Calling shopify-sync-all edge function...");
    
    // Add a timeout to the API call to prevent hanging indefinitely
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("API call timed out after 90 seconds")), 90000); // 90 second timeout
    });
    
    // Implement manual retry logic
    const maxRetries = 3;
    const baseDelay = 2000; // 2 seconds initial delay
    let attempt = 0;
    let lastError: any = null;
    
    while (attempt < maxRetries) {
      try {
        // Actual API call
        const apiCallPromise = supabase.functions.invoke('shopify-sync-all', {
          body: { 
            apiToken: token,
            operation: "import" // Specify operation type
          }
        });
        
        // Use Promise.race to implement the timeout
        const response = await Promise.race([apiCallPromise, timeoutPromise]) as any;
        
        if (response.error) {
          throw new Error(`Failed to connect to Shopify API: ${response.error.message || 'Unknown error'}`);
        }
        
        // Check if the response indicates a successful import
        if (!response.success) {
          addDebugMessage(`Warning: API returned success=false, message: ${response.error || 'No error message provided'}`);
        } else {
          addDebugMessage(`Successfully imported ${response.imported || 0} active unfulfilled orders`);
        }
        
        return response;
      } catch (error: any) {
        lastError = error;
        attempt++;
        
        // If we've used all our retries, throw the error
        if (attempt >= maxRetries) {
          break;
        }
        
        // Calculate exponential backoff delay
        const delay = baseDelay * Math.pow(2, attempt - 1);
        addDebugMessage(`API call attempt ${attempt} failed, retrying in ${delay/1000} seconds...`);
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // If we got here, all retries failed
    throw lastError || new Error("All API call attempts failed");
    
  } catch (error) {
    console.error("Error importing orders:", error);
    throw error;
  }
};

/**
 * Update the last sync time in the database
 */
export const updateLastSyncTime = async (addDebugMessage: (message: string) => void) => {
  try {
    addDebugMessage("Updating last sync time...");
    const { error: updateError } = await supabase.rpc("upsert_shopify_setting", {
      setting_name_param: "last_sync_time",
      setting_value_param: new Date().toISOString()
    });

    if (updateError) {
      throw new Error(`Failed to update last sync time: ${updateError.message}`);
    }
    addDebugMessage("Successfully updated last sync time");
  } catch (error) {
    console.error("Error updating last sync time:", error);
    throw error;
  }
};
