
import { PickStatsData } from "@/components/stats/PickStats";

// This is a mock implementation that returns static data
// In a real application, this would fetch data from your API
export const fetchPickStatsData = async (): Promise<PickStatsData> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Return mock data
  return {
    totalOrdersToPick: 12,
    totalItemsToPick: 37,
    averagePickTime: "14m",
    readyToPick: 28,
    pendingItems: 9,
    outOfStock: 3,
    ordersProcessedToday: 15
  };
};
