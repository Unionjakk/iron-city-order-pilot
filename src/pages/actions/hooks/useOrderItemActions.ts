
import { useToast } from "@/hooks/use-toast";
import { Toast, ToasterToast } from "@/hooks/use-toast";

interface UseOrderItemActionsProps {
  toast: (props: Toast) => { id: string; dismiss: () => void; update: (props: ToasterToast) => void; };
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
