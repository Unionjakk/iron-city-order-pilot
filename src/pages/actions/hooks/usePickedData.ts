
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

  const fetchData = async () => {
    const { orders: fetchedOrders, debug } = await fetchPickedData();
    setOrders(fetchedOrders);
    return debug;
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
