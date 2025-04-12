
import { useState, useEffect } from "react";
import { PicklistOrder, PicklistDebugInfo, PicklistDataResult } from "../types/picklistTypes";
import { 
  initializeDebugInfo,
  finalizeDebugInfo
} from "../services/orderedDataService";
import { fetchOrderedData } from "../services/orderedDataFetcher";
import { processOrderedData } from "../utils/orderedDataProcessingUtils";

/**
 * Hook to fetch and manage "Ordered" data
 */
export const useOrderedData = (): PicklistDataResult => {
  const [orders, setOrders] = useState<PicklistOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<PicklistDebugInfo>({} as PicklistDebugInfo);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    // Initialize debug information
    const debug = initializeDebugInfo();
    
    try {
      // Fetch all required data
      const { 
        ordersData, 
        lineItemsData, 
        stockMap, 
        progressMap, 
        debug: updatedDebug 
      } = await fetchOrderedData(debug);
      
      // Early return if no data found at various stages
      if (ordersData.length === 0) {
        setDebugInfo(finalizeDebugInfo(updatedDebug));
        setOrders([]);
        setIsLoading(false);
        return;
      }
      
      // Process the data into the final format
      const processedOrders = processOrderedData(
        ordersData, 
        lineItemsData, 
        stockMap, 
        progressMap,
        updatedDebug
      );
      
      setDebugInfo(finalizeDebugInfo(updatedDebug));
      setOrders(processedOrders);
    } catch (err: any) {
      console.error("Error fetching ordered data:", err);
      setError(err.message);
      setDebugInfo({ 
        ...finalizeDebugInfo(debug), 
        error: err.message 
      });
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);
  
  return {
    orders,
    isLoading,
    error,
    refreshData: fetchData,
    debugInfo
  };
};
