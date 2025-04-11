
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Clock, CheckCircle, ShoppingBag, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchAccuratePickStatsData, refreshAllStats } from "@/services/stats";
import { toast } from "sonner";

interface PickStatsProps {
  className?: string;
}

export interface PickStatsData {
  totalOrdersToPick: number;
  totalItemsToPick: number;
  averagePickTime: string;
  readyToPick: number;
  pendingItems: number;
  outOfStock: number;
  ordersProcessedToday: number;
}

const PickStats = ({ className }: PickStatsProps) => {
  const [stats, setStats] = useState<PickStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use the accurate data fetching function instead of the cached one
      const data = await fetchAccuratePickStatsData();
      setStats(data);
    } catch (err: any) {
      console.error("Error loading pick stats:", err);
      setError(err.message || "Failed to load statistics");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Manually refresh all stats in the database
      const success = await refreshAllStats();
      if (success) {
        toast.success("Statistics refreshed successfully");
        // Load the fresh stats
        await loadStats();
      } else {
        toast.error("Failed to refresh statistics");
      }
    } catch (err) {
      console.error("Error refreshing stats:", err);
      toast.error("Failed to refresh statistics");
    } finally {
      setIsRefreshing(false);
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
              <RefreshCcw className="mr-2 h-4 w-4" />
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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">Pick Stats</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs"
          >
            <RefreshCcw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Stats'}
          </Button>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full bg-zinc-700" />
            <Skeleton className="h-10 w-full bg-zinc-700" />
            <Skeleton className="h-10 w-full bg-zinc-700" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-zinc-400 text-sm">Orders To Pick</p>
                <p className="text-xl font-semibold text-orange-400">{stats.totalOrdersToPick}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Package className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-zinc-400 text-sm">Items To Pick</p>
                <p className="text-xl font-semibold text-orange-400">{stats.totalItemsToPick}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-zinc-400 text-sm">Ready to Pick</p>
                <p className="text-xl font-semibold text-green-400">{stats.readyToPick}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-zinc-400 text-sm">Avg. Pick Time</p>
                <p className="text-xl font-semibold text-amber-400">{stats.averagePickTime}</p>
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

export default PickStats;
