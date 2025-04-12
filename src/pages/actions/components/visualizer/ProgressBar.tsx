
import { PicklistOrder } from "../../types/picklistTypes";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProgressBarProps {
  order: PicklistOrder;
}

const ProgressBar = ({ order }: ProgressBarProps) => {
  // Calculated status segments
  const segments = calculateProgressSegments(order);
  
  // If there are no segments (no items), return null
  if (segments.length === 0) return null;
  
  return (
    <TooltipProvider>
      <div className="w-full h-3 bg-gray-100 rounded-full relative overflow-hidden flex">
        {segments.map((segment, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <div 
                style={{ 
                  width: `${segment.percentage}%`,
                  backgroundColor: getStatusColor(segment.status)
                }}
                className="h-full"
              />
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                {segment.status}: {segment.count} items ({segment.percentage.toFixed(0)}%)
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

// Helper function to calculate progress segments for an order
function calculateProgressSegments(order: PicklistOrder) {
  const totalItems = order.items.length;
  if (totalItems === 0) return [];
  
  const statusCounts: Record<string, number> = {};
  
  // Count items by status
  order.items.forEach(item => {
    const status = item.progress || "Unknown";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  
  // Convert to segments with percentages
  return Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    percentage: (count / totalItems) * 100
  }));
}

// Helper function to get color based on status
function getStatusColor(status: string): string {
  const statusLower = status.toLowerCase();
  
  switch (statusLower) {
    case "to pick":
      return "#fbbf24"; // yellow-400
    case "picking":
      return "#f59e0b"; // amber-500
    case "picked":
      return "#10b981"; // green-500
    case "to order":
      return "#8b5cf6"; // purple-500
    case "ordered":
      return "#3b82f6"; // blue-500
    case "to dispatch":
      return "#14b8a6"; // teal-500
    case "fulfilled":
      return "#059669"; // emerald-600
    default:
      return "#9ca3af"; // gray-400
  }
}

export default ProgressBar;
