import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Package, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchPickedStatsData } from "@/services/stats";

interface PickedStatsProps {
  className?: string;
}

export interface PickedStatsData {
  totalOrdersPicked: number;
  totalItemsPicked: number;
  readyToDispatch: number;
  avgTimeToDispatch: string;
  pickedToday: number;
  awaitingItems: number;
  completionRate: string;
}

const PickedStats = ({ className }: PickedStatsProps) => {
  const [stats, setStats] = useState<PickedStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPickedStatsData();
      setStats(data);
    } catch (err: any) {
      console.error("Error loading picked stats:", err);
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
              <Package className="mr-2 h-4 w-4" />
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
        <h3 className="text-lg font-medium text-white mb-4">Picked Stats</h3>
        
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full bg-zinc-700" />
            <Skeleton className="h-10 w-full bg-zinc-700" />
            <Skeleton className="h-10 w-full bg-zinc-700" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-zinc-400 text-sm">Orders Picked</p>
                <p className="text-xl font-semibold text-green-400">{stats.totalOrdersPicked}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Package className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-zinc-400 text-sm">Items Picked</p>
                <p className="text-xl font-semibold text-green-400">{stats.totalItemsPicked}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-zinc-400 text-sm">Picked Today</p>
                <p className="text-xl font-semibold text-blue-400">{stats.pickedToday}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-zinc-400 text-sm">Ready to Dispatch</p>
                <p className="text-xl font-semibold text-amber-400">{stats.readyToDispatch}</p>
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

export default PickedStats;
