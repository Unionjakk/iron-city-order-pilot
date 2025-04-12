
import { useState, useEffect } from "react";
import { DragAndDropOrderItem } from "../types/dragAndDropTypes";
import { useToast } from "@/hooks/use-toast";
import { fetchDragAndDropData } from "../services/dragAndDropDataService";

export interface DragAndDropDataResult {
  orderItems: DragAndDropOrderItem[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => void;
  lastRefreshTime: string | null;
}

export const useDragAndDropData = (): DragAndDropDataResult => {
  const { toast } = useToast();
  const [orderItems, setOrderItems] = useState<DragAndDropOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchDragAndDropData();
      setOrderItems(result.orderItems);
      setLastRefreshTime(result.lastRefreshTime);
      
    } catch (err: any) {
      console.error("Error fetching drag and drop data:", err);
      setError(err.message);
      toast({
        title: "Error",
        description: `Failed to load drag and drop data: ${err.message}`,
        variant: "destructive",
      });
      setOrderItems([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);
  
  return {
    orderItems,
    isLoading,
    error,
    refreshData: fetchData,
    lastRefreshTime
  };
};
