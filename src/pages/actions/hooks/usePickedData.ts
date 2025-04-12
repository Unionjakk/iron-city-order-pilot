
import { useState, useEffect } from "react";
import { PicklistOrder, PicklistDebugInfo, PicklistDataResult } from "../types/picklistTypes";
import { usePickedDataFetcher } from "./usePickedDataFetcher";

/**
 * Hook to fetch and manage picked items data
 */
export const usePickedData = (): PicklistDataResult => {
  const [orders, setOrders] = useState<PicklistOrder[]>([]);
  const { 
    fetchPickedData, 
    isLoading, 
    error, 
    debugInfo 
  } = usePickedDataFetcher();

  const fetchData = async (): Promise<void> => {
    const { orders: fetchedOrders } = await fetchPickedData();
    setOrders(fetchedOrders);
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
