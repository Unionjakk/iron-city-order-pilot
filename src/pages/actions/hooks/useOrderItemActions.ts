
import { useToast, toast } from "@/hooks/use-toast";

interface UseOrderItemActionsProps {
  sku: string;
  toast: ReturnType<typeof useToast>;
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
