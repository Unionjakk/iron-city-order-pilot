
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
      className = "border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30";
      break;
    case "picking":
      variant = "outline";
      className = "border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/30";
      break;
    case "picked":
      variant = "outline";
      className = "border-green-500 text-green-600 bg-green-50 dark:bg-green-950/30";
      break;
    case "to order":
      variant = "outline";
      className = "border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950/30";
      break;
    case "ordered":
      variant = "outline";
      className = "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/30";
      break;
    case "to dispatch":
      variant = "outline";
      className = "border-teal-500 text-teal-600 bg-teal-50 dark:bg-teal-950/30";
      break;
    case "fulfilled":
      variant = "outline";
      className = "border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30";
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
