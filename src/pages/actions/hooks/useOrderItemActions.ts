
import { useToast } from "@/hooks/use-toast";

interface UseOrderItemActionsProps {
  toast: ReturnType<typeof useToast>["toast"];
}

export const useOrderItemActions = (sku: string, { toast }: UseOrderItemActionsProps) => {
  const handleCopySku = () => {
    navigator.clipboard.writeText(sku);
    toast({
      title: "SKU Copied",
      description: `${sku} copied to clipboard`,
    });
  };

  return {
    handleCopySku
  };
};
