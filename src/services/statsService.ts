
import { PickStatsData } from "@/components/stats/PickStats";
import { PickedStatsData } from "@/components/stats/PickedStats";
import { OrderedStatsData } from "@/components/stats/OrderedStats";

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

// Mock data for Picked Stats
export const fetchPickedStatsData = async (): Promise<PickedStatsData> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock data
  return {
    totalOrdersPicked: 18,
    totalItemsPicked: 52,
    readyToDispatch: 14,
    avgTimeToDispatch: "35m",
    pickedToday: 8,
    awaitingItems: 4,
    completionRate: "87%"
  };
};

// Mock data for To Order Stats
export const fetchOrderedStatsData = async (): Promise<OrderedStatsData> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  // Return mock data
  return {
    totalOrdersToOrder: 9,
    totalItemsToOrder: 27,
    averageWaitTime: "3d 4h",
    readyToOrder: 15,
    pendingApproval: 7,
    outOfStock: 5,
    ordersPlacedToday: 3
  };
};
