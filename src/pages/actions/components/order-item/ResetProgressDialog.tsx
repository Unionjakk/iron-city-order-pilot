
import React from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ResetProgressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shopifyLineItemId: string;
  sku: string;
  onReset: () => void;
}

const ResetProgressDialog: React.FC<ResetProgressDialogProps> = ({
  isOpen,
  onClose,
  shopifyLineItemId,
  sku,
  onReset
}) => {
  const { toast } = useToast();
  
  const handleReset = async () => {
    try {
      // Delete the progress entry
      const { error } = await supabase
        .from('iron_city_order_progress')
        .delete()
        .eq('shopify_line_item_id', shopifyLineItemId)
        .eq('sku', sku);

      if (error) throw error;
      
      toast({
        title: "Progress Reset",
        description: "Item has been reset to 'To Pick' status",
      });
      
      onReset();
      onClose();
    } catch (error) {
      console.error("Error resetting progress:", error);
      let errorMessage = "An unknown error occurred";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        try {
          errorMessage = String(error);
        } catch {
          errorMessage = "Error details unavailable";
        }
      }

      toast({
        title: "Reset Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-orange-500">Reset Progress</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            This will reset the item to "To Pick" status. Are you sure you want to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleReset}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Reset Progress
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ResetProgressDialog;
