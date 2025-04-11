
import { useState } from "react";
import { format } from "date-fns";
import { ExternalLink, Package } from "lucide-react";
import { PicklistOrder } from "../hooks/usePicklistData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PicklistTableProps {
  orders: PicklistOrder[];
  refreshData: () => void;
}

const PicklistTable = ({ orders, refreshData }: PicklistTableProps) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [actions, setActions] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  const handleNotesChange = (itemId: string, value: string) => {
    setNotes(prev => ({ ...prev, [itemId]: value }));
  };

  const handleActionChange = (itemId: string, value: string) => {
    setActions(prev => ({ ...prev, [itemId]: value }));
  };

  const handleSubmit = async (order: PicklistOrder, itemId: string, sku: string) => {
    const action = actions[itemId];
    const note = notes[itemId] || "";
    
    if (!action) {
      toast({
        title: "Action required",
        description: "Please select an action before submitting",
        variant: "destructive",
      });
      return;
    }
    
    setProcessing(prev => ({ ...prev, [itemId]: true }));
    
    try {
      // First delete any existing progress entries for this order/SKU combination
      await supabase
        .from('iron_city_order_progress')
        .delete()
        .eq('shopify_order_id', order.shopify_order_id)
        .eq('sku', sku);
      
      // Insert new progress entry
      const { error } = await supabase
        .from('iron_city_order_progress')
        .insert({
          shopify_order_id: order.shopify_order_id,
          shopify_order_number: order.shopify_order_number,
          sku: sku,
          progress: action,
          notes: note
        });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Item marked as ${action}`,
      });
      
      // Clear form fields
      setNotes(prev => ({ ...prev, [itemId]: "" }));
      setActions(prev => ({ ...prev, [itemId]: "" }));
      
      // Refresh data
      refreshData();
    } catch (error: any) {
      console.error("Error updating progress:", error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy");
    } catch (e) {
      return "Invalid date";
    }
  };
  
  const getShopifyOrderUrl = (orderId: string) => {
    return `https://admin.shopify.com/store/opus-harley-davidson/orders/${orderId}`;
  };

  if (orders.length === 0) {
    return (
      <div className="p-6 text-center">
        <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-2 text-lg font-semibold">No orders to pick</h3>
        <p className="text-muted-foreground">
          All orders for Leeds Iron City Motorcycles have been processed or there are no unfulfilled orders.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Order</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Price</TableHead>
            <TableHead className="bg-green-50 dark:bg-green-900/20">Stock</TableHead>
            <TableHead className="bg-green-50 dark:bg-green-900/20">Location</TableHead>
            <TableHead className="bg-green-50 dark:bg-green-900/20">Cost</TableHead>
            <TableHead className="bg-amber-50 dark:bg-amber-900/20">Action</TableHead>
            <TableHead className="bg-amber-50 dark:bg-amber-900/20">Notes</TableHead>
            <TableHead className="bg-amber-50 dark:bg-amber-900/20">Submit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            order.items.map((item, index) => (
              <TableRow key={item.id} className={index === 0 ? "border-t-2 border-orange-200" : ""}>
                {index === 0 && (
                  <>
                    <TableCell rowSpan={order.items.length} className="font-medium align-top">
                      <a 
                        href={getShopifyOrderUrl(order.shopify_order_id)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:underline"
                      >
                        {order.shopify_order_number || order.shopify_order_id.substring(0, 8)}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell rowSpan={order.items.length} className="align-top">
                      {formatDate(order.created_at)}
                    </TableCell>
                  </>
                )}
                <TableCell>{item.sku}</TableCell>
                <TableCell>{item.title}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>
                  {item.price ? `$${item.price.toFixed(2)}` : "N/A"}
                </TableCell>
                
                {/* Pinnacle Stock Data - different color to indicate different data source */}
                <TableCell className="bg-green-50 dark:bg-green-900/20">
                  {item.in_stock ? 
                    `${item.stock_quantity || 0}` : 
                    "Not in stock"}
                </TableCell>
                <TableCell className="bg-green-50 dark:bg-green-900/20">
                  {item.in_stock ? item.bin_location || "No location" : "N/A"}
                </TableCell>
                <TableCell className="bg-green-50 dark:bg-green-900/20">
                  {item.in_stock && item.cost ? 
                    `$${item.cost.toFixed(2)}` : 
                    "N/A"}
                </TableCell>
                
                {/* Action Section */}
                <TableCell className="bg-amber-50 dark:bg-amber-900/20">
                  <Select 
                    value={actions[item.id] || ""} 
                    onValueChange={(value) => handleActionChange(item.id, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Picked">Picked</SelectItem>
                      <SelectItem value="To Order">To Order</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="bg-amber-50 dark:bg-amber-900/20">
                  <Textarea 
                    placeholder="Add notes here..." 
                    className="min-h-[60px] max-h-[100px]"
                    value={notes[item.id] || ""}
                    onChange={(e) => handleNotesChange(item.id, e.target.value)}
                  />
                </TableCell>
                <TableCell className="bg-amber-50 dark:bg-amber-900/20">
                  <Button 
                    onClick={() => handleSubmit(order, item.id, item.sku)}
                    disabled={!actions[item.id] || processing[item.id]}
                    size="sm"
                  >
                    {processing[item.id] ? "Saving..." : "Save"}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PicklistTable;
