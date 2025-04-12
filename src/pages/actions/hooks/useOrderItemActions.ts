
import { useToast } from "@/hooks/use-toast";

export const useOrderItemActions = (sku: string, toast: ReturnType<typeof useToast>) => {
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
