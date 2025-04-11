import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, TruckIcon, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchOrderedStatsData } from "@/services/stats";

interface OrderedStatsProps {
  className?: string;
}

export interface OrderedStatsData {
  totalOrdersToOrder: number;
  totalItemsToOrder: number;
  averageWaitTime: string;
  readyToOrder: number;
  pendingApproval: number;
  outOfStock: number;
  ordersPlacedToday: number;
}

const OrderedStats = ({ className }: OrderedStatsProps) => {
  const [stats, setStats] = useState<OrderedStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchOrderedStatsData();
      setStats(data);
    } catch (err: any) {
      console.error("Error loading ordered stats:", err);
      setError(err.message || "Failed to load statistics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (error) {
    return (
      <Card className="bg-zinc-800 border-zinc-700">
        <CardContent className="p-6">
          <div className="text-center text-red-400">
            <p>{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadStats} 
              className="mt-2"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-zinc-800 border-zinc-700 ${className}`}>
      <CardContent className="p-6">
        <h3 className="text-lg font-medium text-white mb-4">Order Stats</h3>
        
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full bg-zinc-700" />
            <Skeleton className="h-10 w-full bg-zinc-700" />
            <Skeleton className="h-10 w-full bg-zinc-700" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-zinc-400 text-sm">Orders To Place</p>
                <p className="text-xl font-semibold text-orange-400">{stats.totalOrdersToOrder}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <TruckIcon className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-zinc-400 text-sm">Items To Order</p>
                <p className="text-xl font-semibold text-orange-400">{stats.totalItemsToOrder}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-zinc-400 text-sm">Pending Approval</p>
                <p className="text-xl font-semibold text-amber-400">{stats.pendingApproval}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-zinc-400 text-sm">Avg. Wait Time</p>
                <p className="text-xl font-semibold text-blue-400">{stats.averageWaitTime}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-zinc-400">No statistics available</p>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderedStats;
