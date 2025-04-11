
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, CheckCircle, ShoppingBag, AlertTriangle } from "lucide-react";
import { fetchAccuratePickStatsData } from "@/services/stats";

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

  const loadStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use the accurate data fetching function
      const data = await fetchAccuratePickStatsData();
      setStats(data);
    } catch (err: any) {
      console.error("Error loading pick stats:", err);
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
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-zinc-800 border-zinc-700 ${className}`}>
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-white">Pick Stats</h3>
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
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-zinc-400 text-sm">Out of Stock</p>
                <p className="text-xl font-semibold text-amber-400">{stats.outOfStock}</p>
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
