
// IMPORTANT: This file uses specific types for toast functionality
// DO NOT modify the import or interface structure without careful consideration
import { useToast } from "@/hooks/use-toast";

// Define a specific type for the toast function to prevent deep type instantiation issues
// This exact typing pattern should be preserved in future edits
type ToastFunction = {
  (props: { title: string; description: string; variant?: "default" | "destructive" }): void;
};

// IMPORTANT NAMING CONVENTION:
// Throughout the application, we use 'shopify_line_item_id' as the column name
// This was previously 'shopify_order_id' and should NOT be changed back
interface UseOrderItemActionsProps {
  toast: ToastFunction;
}

export const useOrderItemActions = (sku: string, { toast }: UseOrderItemActionsProps) => {
  const handleCopySku = () => {
    navigator.clipboard.writeText(sku);
    // Call toast directly using the passed function
    toast({
      title: "SKU Copied",
      description: `${sku} copied to clipboard`,
    });
  };

  return {
    handleCopySku
  };
};
