
import { useState, useEffect } from 'react';
import { UseImportOperationProps, UseImportOperationReturn } from './types';
import { supabase } from '@/integrations/supabase/client';

export const useImportOperation = (
  refreshState: UseImportOperationProps['refreshState']
): UseImportOperationReturn => {
  const [isStatusCheckPending, setIsStatusCheckPending] = useState(false);
  
  // Extract background processing flag from refresh state
  const { isBackgroundProcessing, setIsBackgroundProcessing, addDebugMessage, isImporting } = refreshState;

  // Check for background import process on component mount
  useEffect(() => {
    const checkImportStatus = async () => {
      // Avoid redundant checks if we know it's already importing or being checked
      if (isImporting || isStatusCheckPending) return;
      
      try {
        setIsStatusCheckPending(true);
        
        // Check if there's a background process running
        const { data, error } = await supabase.rpc("get_shopify_setting", { 
          setting_name_param: 'shopify_import_status' 
        });
        
        if (error) {
          console.error('Error checking import status:', error);
          return;
        }
        
        // If import is running in background, set the flag
        if (data === 'importing' || data === 'background') {
          setIsBackgroundProcessing(true);
          addDebugMessage(`[${new Date().toLocaleTimeString()}] Detected ongoing background import process`);
        } else {
          setIsBackgroundProcessing(false);
        }
      } catch (err) {
        console.error('Exception checking import status:', err);
      } finally {
        setIsStatusCheckPending(false);
      }
    };
    
    // Check immediately on mount
    checkImportStatus();
    
    // Also set up an interval to check periodically
    const interval = setInterval(checkImportStatus, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  return { isBackgroundProcessing };
};
