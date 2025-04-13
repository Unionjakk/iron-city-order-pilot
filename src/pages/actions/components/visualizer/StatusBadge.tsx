
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string | null;
  count?: number;
  showCount?: boolean;
}

const StatusBadge = ({ status, count, showCount = true }: StatusBadgeProps) => {
  if (!status) return null;
  
  const statusLower = status.toLowerCase();
  
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
  let className = "";
  
  switch (statusLower) {
    case "to pick":
      variant = "outline";
      className = "border-amber-600 text-amber-700 bg-amber-50/50 dark:bg-amber-950/20";
      break;
    case "picked":
      variant = "outline";
      className = "border-green-600 text-green-700 bg-green-50/50 dark:bg-green-950/20";
      break;
    case "to order":
      variant = "outline";
      className = "border-purple-600 text-purple-700 bg-purple-50/50 dark:bg-purple-950/20";
      break;
    case "ordered":
      variant = "outline";
      className = "border-blue-600 text-blue-700 bg-blue-50/50 dark:bg-blue-950/20";
      break;
    case "to dispatch":
      variant = "outline";
      className = "border-teal-600 text-teal-700 bg-teal-50/50 dark:bg-teal-950/20";
      break;
    default:
      variant = "outline";
      className = "border-gray-500 text-gray-600 bg-gray-50 dark:bg-gray-950/30";
  }
  
  return (
    <Badge variant={variant} className={className}>
      {status}{showCount && count !== undefined ? ` (${count})` : ""}
    </Badge>
  );
};

export default StatusBadge;
