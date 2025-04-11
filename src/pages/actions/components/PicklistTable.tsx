
import { useState } from "react";
import { format } from "date-fns";
import { ExternalLink, Mail } from "lucide-react";
import { PicklistOrder } from "../hooks/usePicklistData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

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

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-800/50">
            <TableHead className="text-orange-500 w-24"></TableHead>
            <TableHead className="text-orange-500">Date</TableHead>
            <TableHead className="text-orange-500"></TableHead>
            <TableHead className="text-orange-500">Qty</TableHead>
            <TableHead className="text-orange-500">Price</TableHead>
            <TableHead className="text-orange-500">Stock</TableHead>
            <TableHead className="text-orange-500">Location</TableHead>
            <TableHead className="text-orange-500">Cost</TableHead>
            <TableHead className="text-orange-500">Action</TableHead>
            <TableHead className="text-orange-500"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <>
              <TableRow key={`order-${order.id}`} className="bg-zinc-800/20">
                <TableCell colSpan={10} className="py-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <div className="flex items-center">
                      <span className="font-semibold text-orange-400">Order:</span>
                      <a 
                        href={getShopifyOrderUrl(order.shopify_order_id)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-2 flex items-center link-styled"
                      >
                        {order.shopify_order_number || order.shopify_order_id.substring(0, 8)}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
                      <div>
                        <span className="text-zinc-400 mr-2">Date:</span>
                        <span className="text-zinc-300">{formatDate(order.created_at)}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 mr-2">Customer:</span>
                        <span className="text-zinc-300">{order.customer_name}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="mr-1 h-3 w-3 text-zinc-400" />
                        <span className="text-zinc-300">{order.customer_email || "No email"}</span>
                      </div>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
              {order.items.map((item) => (
                <>
                  <TableRow key={item.id} className="hover:bg-zinc-800/30 border-t border-zinc-800/30">
                    <TableCell className="font-mono text-zinc-300">{item.sku}</TableCell>
                    <TableCell></TableCell>
                    <TableCell>{item.title}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell>
                      {item.price ? `£${item.price.toFixed(2)}` : "N/A"}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.in_stock ? (
                        <span className="text-green-500">{item.stock_quantity || 0}</span>
                      ) : (
                        <span className="text-red-500">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.in_stock ? (
                        <span className="text-zinc-300">{item.bin_location || "No location"}</span>
                      ) : (
                        <span className="text-zinc-500">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.in_stock && item.cost ? (
                        <span className="text-zinc-300">£{item.cost.toFixed(2)}</span>
                      ) : (
                        <span className="text-zinc-500">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={actions[item.id] || ""} 
                        onValueChange={(value) => handleActionChange(item.id, value)}
                      >
                        <SelectTrigger className="w-full border-zinc-700 bg-zinc-800/50 text-zinc-300">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Picked">Picked</SelectItem>
                          <SelectItem value="To Order">To Order</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button 
                        onClick={() => handleSubmit(order, item.id, item.sku)}
                        disabled={!actions[item.id] || processing[item.id]}
                        size="sm"
                        className="button-primary w-full"
                      >
                        {processing[item.id] ? "Saving..." : "Save"}
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-none">
                    <TableCell colSpan={9}></TableCell>
                    <TableCell className="pt-0 pb-4">
                      <Textarea 
                        placeholder="Add notes here..." 
                        className="min-h-[60px] border-zinc-700 bg-zinc-800/50 text-zinc-300"
                        value={notes[item.id] || ""}
                        onChange={(e) => handleNotesChange(item.id, e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                </>
              ))}
              <TableRow className="h-4">
                <TableCell colSpan={10} className="p-0">
                  <Separator className="bg-zinc-800/50" />
                </TableCell>
              </TableRow>
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PicklistTable;
