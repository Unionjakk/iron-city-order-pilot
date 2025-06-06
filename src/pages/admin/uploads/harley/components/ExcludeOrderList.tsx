
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, Check, X } from 'lucide-react';
import { ExcludedOrder } from '../types/excludeTypes';
import { format } from 'date-fns';

interface ExcludeOrderListProps {
  excludedOrders: ExcludedOrder[];
  isLoading: boolean;
  onRemoveExclusion: (id: string) => void;
}

const ExcludeOrderList = ({ excludedOrders, isLoading, onRemoveExclusion }: ExcludeOrderListProps) => {
  if (isLoading) {
    return (
      <div className="py-8 text-center text-zinc-400">
        <div className="h-6 w-6 border-2 border-orange-500 border-r-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p>Loading checked in orders...</p>
      </div>
    );
  }

  if (excludedOrders.length === 0) {
    return (
      <div className="py-8 text-center text-zinc-400">
        <p>No orders are currently checked in.</p>
      </div>
    );
  }

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'Check In':
        return <Check className="mr-1.5 h-4 w-4 text-green-500" />;
      case 'Not Shopify':
        return <X className="mr-1.5 h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Check if any order has details available (not just placeholder values)
  const hasDetailedOrders = excludedOrders.some(order => 
    order.dealer_po_number !== '-' || order.order_type !== '-'
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-700">
            <TableHead className="text-zinc-300">Order Number</TableHead>
            {/* Only show these columns if at least one order has details */}
            {hasDetailedOrders && (
              <>
                <TableHead className="text-zinc-300">Dealer PO Number</TableHead>
                <TableHead className="text-zinc-300">Order Type</TableHead>
              </>
            )}
            <TableHead className="text-zinc-300">Reason</TableHead>
            <TableHead className="text-zinc-300">Added On</TableHead>
            <TableHead className="text-zinc-300 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {excludedOrders.map((order) => (
            <TableRow key={order.id} className="border-zinc-800">
              <TableCell className="font-medium text-zinc-200">{order.hd_order_number}</TableCell>
              {/* Only show these cells if we're showing the columns */}
              {hasDetailedOrders && (
                <>
                  <TableCell className="text-zinc-300">{order.dealer_po_number}</TableCell>
                  <TableCell className="text-zinc-300">{order.order_type}</TableCell>
                </>
              )}
              <TableCell>
                <div className="flex items-center text-zinc-300">
                  {getReasonIcon(order.reason)}
                  {order.reason}
                </div>
              </TableCell>
              <TableCell className="text-zinc-400">
                {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveExclusion(order.id)}
                  className="text-zinc-400 hover:text-red-500 hover:bg-zinc-800"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ExcludeOrderList;
