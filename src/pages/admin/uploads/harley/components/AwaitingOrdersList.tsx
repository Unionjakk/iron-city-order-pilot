import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Check, X, AlertCircle } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { ExcludeReason } from '../types/excludeTypes';

interface AwaitingOrder {
  hd_order_number: string;
  dealer_po_number?: string;
  order_type?: string;
}

interface AwaitingOrdersListProps {
  onCheckInOrder: (orderNumber: string, reason: ExcludeReason) => Promise<void>;
  excludedOrderNumbers: string[];
  isLoading: boolean;
}

const AwaitingOrdersList = ({ 
  onCheckInOrder, 
  excludedOrderNumbers, 
  isLoading 
}: AwaitingOrdersListProps) => {
  const [awaitingOrders, setAwaitingOrders] = useState<AwaitingOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchAwaitingOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('hd_orders')
        .select('hd_order_number, dealer_po_number, order_type')
        .order('hd_order_number', { ascending: true })
        .limit(50);
        
      if (error) {
        throw error;
      }
      
      const filteredOrders = data.filter(
        order => !excludedOrderNumbers.includes(order.hd_order_number)
      );
      
      setAwaitingOrders(filteredOrders);
    } catch (error) {
      console.error('Error fetching awaiting orders:', error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      fetchAwaitingOrders();
    }
  }, [isLoading, excludedOrderNumbers]);

  const handleCheckInOrder = async (reason: ExcludeReason) => {
    if (!selectedOrder) return;
    
    setIsProcessing(true);
    try {
      await onCheckInOrder(selectedOrder, reason);
      setIsDialogOpen(false);
    } finally {
      setIsProcessing(false);
      setSelectedOrder(null);
    }
  };

  if (isLoadingOrders) {
    return (
      <div className="py-8 text-center text-zinc-400">
        <div className="h-6 w-6 border-2 border-orange-500 border-r-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p>Loading awaiting orders...</p>
      </div>
    );
  }

  if (awaitingOrders.length === 0) {
    return (
      <div className="py-8 text-center text-zinc-400">
        <AlertCircle className="h-6 w-6 mx-auto mb-2 text-orange-400" />
        <p>No awaiting orders found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-700">
              <TableHead className="text-zinc-300">Order Number</TableHead>
              <TableHead className="text-zinc-300">Dealer PO Number</TableHead>
              <TableHead className="text-zinc-300">Order Type</TableHead>
              <TableHead className="text-zinc-300 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {awaitingOrders.map((order) => (
              <TableRow key={order.hd_order_number} className="border-zinc-800">
                <TableCell className="font-medium text-zinc-200">
                  {order.hd_order_number}
                </TableCell>
                <TableCell className="text-zinc-300">
                  {order.dealer_po_number || '-'}
                </TableCell>
                <TableCell className="text-zinc-300">
                  {order.order_type || '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Dialog open={isDialogOpen && selectedOrder === order.hd_order_number} 
                          onOpenChange={(open) => {
                            setIsDialogOpen(open);
                            if (!open) setSelectedOrder(null);
                          }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOrder(order.hd_order_number)}
                        className="text-zinc-400 hover:text-orange-500 hover:bg-zinc-800"
                      >
                        Process Order
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                      <DialogHeader>
                        <DialogTitle className="text-orange-500">Process Order {order.hd_order_number}</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                          Choose an action for this order.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col space-y-4 py-4">
                        <p className="text-zinc-300">What would you like to do with this order?</p>
                      </div>
                      <DialogFooter className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          className="border-zinc-700 text-zinc-300"
                        >
                          Cancel
                        </Button>
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={isProcessing}
                          onClick={() => handleCheckInOrder('Check In')}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Check In
                        </Button>
                        <Button 
                          className="bg-red-600 hover:bg-red-700 text-white"
                          disabled={isProcessing}
                          onClick={() => handleCheckInOrder('Not Shopify')}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Not Shopify
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default AwaitingOrdersList;
