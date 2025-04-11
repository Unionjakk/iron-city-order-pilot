
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, Check, X } from 'lucide-react';
import { ExcludedLineItem } from '../types/excludeTypes';
import { format } from 'date-fns';

interface ExcludeLineItemListProps {
  excludedLineItems: ExcludedLineItem[];
  isLoading: boolean;
  onRemoveExclusion: (id: string) => void;
}

const ExcludeLineItemList = ({ excludedLineItems, isLoading, onRemoveExclusion }: ExcludeLineItemListProps) => {
  if (isLoading) {
    return (
      <div className="py-8 text-center text-zinc-400">
        <div className="h-6 w-6 border-2 border-orange-500 border-r-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p>Loading checked in line items...</p>
      </div>
    );
  }

  if (excludedLineItems.length === 0) {
    return (
      <div className="py-8 text-center text-zinc-400">
        <p>No line items are currently checked in.</p>
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

  // Check if any line item has details available (not just placeholder values)
  const hasDetailedLineItems = excludedLineItems.some(item => 
    item.part_number !== '-' || item.description !== '-'
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-700">
            <TableHead className="text-zinc-300">Order Number</TableHead>
            <TableHead className="text-zinc-300">Line Number</TableHead>
            {/* Only show these columns if at least one item has details */}
            {hasDetailedLineItems && (
              <>
                <TableHead className="text-zinc-300">Part Number</TableHead>
                <TableHead className="text-zinc-300">Description</TableHead>
              </>
            )}
            <TableHead className="text-zinc-300">Reason</TableHead>
            <TableHead className="text-zinc-300">Added On</TableHead>
            <TableHead className="text-zinc-300 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {excludedLineItems.map((item) => (
            <TableRow key={item.id} className="border-zinc-800">
              <TableCell className="font-medium text-zinc-200">{item.hd_order_number}</TableCell>
              <TableCell className="text-zinc-300">{item.line_number}</TableCell>
              {/* Only show these cells if we're showing the columns */}
              {hasDetailedLineItems && (
                <>
                  <TableCell className="text-zinc-300">{item.part_number}</TableCell>
                  <TableCell className="text-zinc-300">{item.description}</TableCell>
                </>
              )}
              <TableCell>
                <div className="flex items-center text-zinc-300">
                  {getReasonIcon(item.reason)}
                  {item.reason}
                </div>
              </TableCell>
              <TableCell className="text-zinc-400">
                {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveExclusion(item.id)}
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

export default ExcludeLineItemList;
