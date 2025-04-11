
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, Trash2, X } from 'lucide-react';
import { ExcludedOrder } from '../LineItemsExclude';

interface ExcludeOrderListProps {
  excludedOrders: ExcludedOrder[];
  isLoading: boolean;
  onRemoveExclusion: (id: string) => void;
}

const ExcludeOrderList = ({ 
  excludedOrders, 
  isLoading, 
  onRemoveExclusion 
}: ExcludeOrderListProps) => {
  if (isLoading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-5 w-5 border-2 border-orange-500 border-r-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-400">Loading exclusions...</p>
        </div>
      </div>
    );
  }

  if (excludedOrders.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-zinc-400">No orders have been excluded yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-700 hover:bg-zinc-800/50">
            <TableHead className="text-zinc-400">Order Number</TableHead>
            <TableHead className="text-zinc-400">Reason</TableHead>
            <TableHead className="text-zinc-400">Date Added</TableHead>
            <TableHead className="text-zinc-400 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {excludedOrders.map((order) => (
            <TableRow key={order.id} className="border-zinc-700 hover:bg-zinc-800/50">
              <TableCell className="font-medium text-zinc-300">
                {order.hd_order_number}
              </TableCell>
              <TableCell>
                {order.reason === 'Check In' ? (
                  <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-700">
                    <Check className="mr-1 h-3 w-3" /> Check In
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-900/20 text-red-400 border-red-700">
                    <X className="mr-1 h-3 w-3" /> Not Shopify
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-zinc-400">
                {new Date(order.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveExclusion(order.id)}
                  className="text-zinc-400 hover:text-red-400 hover:bg-red-950/20"
                >
                  <Trash2 className="h-4 w-4" />
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
