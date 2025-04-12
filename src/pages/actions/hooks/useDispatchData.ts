
import { useState, useEffect } from "react";
import { PicklistOrder, PicklistDebugInfo, PicklistDataResult } from "../types/picklistTypes";
import { useDispatchDataFetcher } from "./useDispatchDataFetcher";

/**
 * Hook to fetch and manage dispatch-ready items data
 */
export const useDispatchData = (): PicklistDataResult => {
  const [orders, setOrders] = useState<PicklistOrder[]>([]);
  const { 
    fetchDispatchData, 
    isLoading, 
    error, 
    debugInfo 
  } = useDispatchDataFetcher();

  const fetchData = async (): Promise<void> => {
    const { orders: fetchedOrders } = await fetchDispatchData();
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
