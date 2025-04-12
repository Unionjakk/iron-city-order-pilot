
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Check, Search } from 'lucide-react';
import { ExcludeReason } from '../types/excludeTypes';

interface AwaitingLineItemsListProps {
  onCheckInLineItem: (orderNumber: string, lineNumber: string, partNumber: string, reason: ExcludeReason) => void;
  excludedLineItemKeys: string[];
  isLoading: boolean;
}

const AwaitingLineItemsList = ({ 
  onCheckInLineItem, 
  excludedLineItemKeys,
  isLoading 
}: AwaitingLineItemsListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLineItems, setFilteredLineItems] = useState<any[]>([]);

  const { data: lineItems, isLoading: isLoadingLineItems } = useQuery({
    queryKey: ['awaiting-line-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hd_order_line_items')
        .select(`
          hd_order_number,
          line_number,
          part_number,
          description,
          status,
          order_date,
          dealer_po_number
        `)
        .is('is_backorder', false)
        .order('hd_order_number', { ascending: true })
        .order('line_number', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error fetching line items:', error);
        throw new Error('Failed to fetch line items');
      }

      return data;
    },
    enabled: !isLoading
  });

  // Filter line items whenever search term or line items data changes
  useEffect(() => {
    if (!lineItems) {
      setFilteredLineItems([]);
      return;
    }

    if (!searchTerm.trim()) {
      setFilteredLineItems(lineItems);
      return;
    }
    
    const search = searchTerm.toLowerCase();
    const filtered = lineItems.filter(item => {
      return (
        (item.hd_order_number && item.hd_order_number.toLowerCase().includes(search)) ||
        (item.line_number && item.line_number.toLowerCase().includes(search)) ||
        (item.part_number && item.part_number.toLowerCase().includes(search)) ||
        (item.description && item.description.toLowerCase().includes(search)) ||
        (item.dealer_po_number && item.dealer_po_number.toLowerCase().includes(search))
      );
    });
    
    setFilteredLineItems(filtered);
  }, [searchTerm, lineItems]);

  const isLineItemExcluded = (orderNumber: string, lineNumber: string) => {
    return excludedLineItemKeys.includes(`${orderNumber}-${lineNumber}`);
  };

  const handleCheckIn = (orderNumber: string, lineNumber: string, partNumber: string) => {
    onCheckInLineItem(orderNumber, lineNumber, partNumber, 'Check In');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  if (isLoading || isLoadingLineItems) {
    return (
      <div className="py-8 text-center text-zinc-400">
        <div className="h-6 w-6 border-2 border-orange-500 border-r-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p>Loading line items...</p>
      </div>
    );
  }

  if (!lineItems || lineItems.length === 0) {
    return (
      <div className="py-8 text-center text-zinc-400">
        <p>No line items found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Search by order #, line #, part #, or description..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="pl-10 bg-zinc-800 text-zinc-100 border-zinc-700 placeholder-zinc-500"
        />
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-700">
              <TableHead className="text-zinc-300">Order Number</TableHead>
              <TableHead className="text-zinc-300">Line Number</TableHead>
              <TableHead className="text-zinc-300">Part Number</TableHead>
              <TableHead className="text-zinc-300">Description</TableHead>
              <TableHead className="text-zinc-300">Status</TableHead>
              <TableHead className="text-zinc-300 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLineItems && filteredLineItems.length > 0 ? (
              filteredLineItems.map((item) => {
                const isExcluded = isLineItemExcluded(item.hd_order_number, item.line_number);
                
                return (
                  <TableRow key={`${item.hd_order_number}-${item.line_number}`} className="border-zinc-800">
                    <TableCell className="font-medium text-zinc-200">{item.hd_order_number}</TableCell>
                    <TableCell className="text-zinc-300">{item.line_number}</TableCell>
                    <TableCell className="text-zinc-300">{item.part_number || '-'}</TableCell>
                    <TableCell className="text-zinc-300">{item.description || '-'}</TableCell>
                    <TableCell className="text-zinc-300">{item.status || '-'}</TableCell>
                    <TableCell className="text-right">
                      {isExcluded ? (
                        <span className="text-zinc-500">Already Checked In</span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCheckIn(item.hd_order_number, item.line_number, item.part_number || '')}
                          className="text-green-500 hover:bg-zinc-800"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Check In
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-zinc-400">
                  No results found for "{searchTerm}"
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AwaitingLineItemsList;
