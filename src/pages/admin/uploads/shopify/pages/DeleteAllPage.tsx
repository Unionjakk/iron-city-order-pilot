
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const DeleteAllPage = () => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure? This will permanently delete all Shopify order data.")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .rpc('delete_all_shopify_orders');
      
      if (error) throw error;
      
      alert("All orders successfully deleted");
    } catch (error) {
      console.error("Error deleting orders:", error);
      alert("Error deleting orders");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">Delete All Shopify Orders</h1>
        <p className="text-orange-400/80">Permanently delete all imported orders</p>
      </div>

      <Alert className="bg-zinc-800/60 border-amber-500/50">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <AlertTitle className="text-amber-500">Warning</AlertTitle>
        <AlertDescription className="text-zinc-300">
          This is a destructive operation that permanently removes all Shopify order data from the database.
        </AlertDescription>
      </Alert>

      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader>
          <CardTitle className="text-red-500">Delete All Shopify Orders and Order Lines</CardTitle>
          <CardDescription>
            Permanently delete all imported Shopify orders and order lines from the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full md:w-auto"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete All Orders"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeleteAllPage;
