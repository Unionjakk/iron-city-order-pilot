
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ResetProgressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shopifyOrderId: string;
  sku: string;
  onReset: () => void;
}

const ResetProgressDialog: React.FC<ResetProgressDialogProps> = ({
  isOpen,
  onClose,
  shopifyOrderId,
  sku,
  onReset
}) => {
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();

  const resetItemProgress = async () => {
    try {
      const { error } = await supabase
        .from('iron_city_order_progress')
        .delete()
        .eq('shopify_order_id', shopifyOrderId)
        .eq('sku', sku);
        
      if (error) throw error;
      
      toast({
        title: "Progress Reset",
        description: "Item has been reset to 'To Pick' status",
      });
      
      onReset();
    } catch (error: any) {
      console.error("Error resetting item progress:", error);
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleResetItem = async () => {
    setIsResetting(true);
    try {
      await resetItemProgress();
    } finally {
      setIsResetting(false);
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-400">Reset Item Progress</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-300">
            This will reset this item's progress status to "To Pick". Are you sure you want to continue?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-500 text-white hover:bg-red-600"
            onClick={handleResetItem}
            disabled={isResetting}
          >
            {isResetting ? 'Resetting...' : 'Reset Progress'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ResetProgressDialog;
