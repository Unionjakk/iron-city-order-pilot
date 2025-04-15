
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ShoppingCart, 
  Package, 
  Truck, 
  ClipboardCheck, 
  ShoppingBag,
  Tag,
  CheckCircle,
  CircleDollarSign
} from "lucide-react";

interface VisualizerStatsProps {
  isLoading: boolean;
  statusCounts: {
    toPick: number;
    picking: number;
    picked: number;
    toOrder: number;
    ordered: number;
    toDispatch: number;
    fulfilled: number;
    other: number;
  };
  totalOrders: number;
}

const StatCard = ({ icon, label, value, color }: { 
  icon: React.ReactNode, 
  label: string, 
  value: number | string,
  color: string 
}) => (
  <div className="flex items-center space-x-4">
    <div className={`p-2 rounded-full ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <h3 className="text-2xl font-bold">{value}</h3>
    </div>
  </div>
);

const VisualizerStats = ({ isLoading, statusCounts, totalOrders }: VisualizerStatsProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalItems = 
    statusCounts.toPick + 
    statusCounts.picking + 
    statusCounts.picked + 
    statusCounts.toOrder + 
    statusCounts.ordered + 
    statusCounts.toDispatch + 
    statusCounts.fulfilled + 
    statusCounts.other;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">
          <StatCard 
            icon={<ShoppingCart className="h-5 w-5 text-white" />} 
            label="Total Orders" 
            value={totalOrders}
            color="bg-blue-500"
          />
          <StatCard 
            icon={<Tag className="h-5 w-5 text-white" />} 
            label="Total Line Items" 
            value={totalItems}
            color="bg-green-500"
          />
          <StatCard 
            icon={<ShoppingBag className="h-5 w-5 text-white" />} 
            label="To Pick" 
            value={statusCounts.toPick}
            color="bg-amber-600"
          />
          <StatCard 
            icon={<CheckCircle className="h-5 w-5 text-white" />} 
            label="Picked" 
            value={statusCounts.picked}
            color="bg-green-600"
          />
          <StatCard 
            icon={<Package className="h-5 w-5 text-white" />} 
            label="To Order" 
            value={statusCounts.toOrder}
            color="bg-purple-600"
          />
          <StatCard 
            icon={<CircleDollarSign className="h-5 w-5 text-white" />} 
            label="Ordered" 
            value={statusCounts.ordered}
            color="bg-blue-600"
          />
          <StatCard 
            icon={<Truck className="h-5 w-5 text-white" />} 
            label="To Dispatch" 
            value={statusCounts.toDispatch}
            color="bg-teal-600"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default VisualizerStats;
