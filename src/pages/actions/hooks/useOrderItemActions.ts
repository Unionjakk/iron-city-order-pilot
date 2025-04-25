
// IMPORTANT: Do not modify the import or interface structure below
// These are specifically designed to work with the toast system
import { useToast } from "@/hooks/use-toast";

// We need to use the function signature directly rather than importing types
// because the Toast and ToasterToast types are not exported from use-toast
interface UseOrderItemActionsProps {
  // This is the correct type for the toast function - do not change this
  toast: ReturnType<typeof useToast>["toast"];
}

export const useOrderItemActions = (sku: string, { toast }: UseOrderItemActionsProps) => {
  const handleCopySku = () => {
    navigator.clipboard.writeText(sku);
    // The toast function is directly callable
    toast({
      title: "SKU Copied",
      description: `${sku} copied to clipboard`,
    });
  };

  return {
    handleCopySku
  };
};
