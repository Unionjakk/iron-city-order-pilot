
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Check, AlertCircle, Search, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ExcludeReason } from '../types/excludeTypes';
import { Input } from '@/components/ui/input';

interface AwaitingLineItemsListProps {
  onCheckInLineItem: (orderNumber: string, lineNumber: string, reason: ExcludeReason) => void;
  excludedLineItemKeys: string[];
  isLoading: boolean;
}

interface LineItem {
  hd_order_number: string;
  line_number: string;
  part_number: string;
  description: string;
}

const AwaitingLineItemsList = ({ 
  onCheckInLineItem, 
  excludedLineItemKeys, 
  isLoading 
}: AwaitingLineItemsListProps) => {
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [filteredLineItems, setFilteredLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchLineItems = async () => {
      setLoading(true);
      try {
        // First get all line items that are not already excluded
        const { data, error } = await supabase
          .from('hd_order_line_items')
          .select('hd_order_number, line_number, part_number, description')
          .not('line_number', 'is', null)
          .limit(100); // Limit to prevent too much data
        
        if (error) throw error;
        
        // Filter out items that are already in the excluded list
        const filteredData = data.filter(item => {
          const key = `${item.hd_order_number}-${item.line_number}`;
          return !excludedLineItemKeys.includes(key);
        });
        
        setLineItems(filteredData);
        setFilteredLineItems(filteredData);
      } catch (error) {
        console.error('Error fetching awaiting line items:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (!isLoading) {
      fetchLineItems();
    }
  }, [isLoading, excludedLineItemKeys]);
  
  useEffect(() => {
    // Filter items based on search term
    if (searchTerm) {
      const filtered = lineItems.filter(item => 
        item.hd_order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.line_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredLineItems(filtered);
    } else {
      setFilteredLineItems(lineItems);
    }
  }, [searchTerm, lineItems]);
  
  if (loading || isLoading) {
    return (
      <div className="py-8 text-center text-zinc-400">
        <div className="h-6 w-6 border-2 border-orange-500 border-r-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p>Loading line items...</p>
      </div>
    );
  }
  
  if (lineItems.length === 0) {
    return (
      <div className="py-8 text-center text-zinc-400 space-y-2">
        <AlertCircle className="mx-auto h-8 w-8 text-orange-500" />
        <p>No line items found that need to be checked in.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 bg-zinc-800 p-2 rounded-md">
        <Search className="h-5 w-5 text-zinc-400" />
        <Input
          type="text"
          placeholder="Search by order #, line #, part # or description"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-0 focus-visible:ring-0 text-zinc-200 placeholder:text-zinc-500"
        />
      </div>
      
      {filteredLineItems.length === 0 ? (
        <div className="py-8 text-center text-zinc-400 space-y-2">
          <Info className="mx-auto h-8 w-8 text-orange-500" />
          <p>No line items match your search criteria.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-700">
                <TableHead className="text-zinc-300">Order Number</TableHead>
                <TableHead className="text-zinc-300">Line Number</TableHead>
                <TableHead className="text-zinc-300">Part Number</TableHead>
                <TableHead className="text-zinc-300">Description</TableHead>
                <TableHead className="text-zinc-300 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLineItems.slice(0, 25).map((item) => (
                <TableRow key={`${item.hd_order_number}-${item.line_number}`} className="border-zinc-800">
                  <TableCell className="font-medium text-zinc-200">{item.hd_order_number}</TableCell>
                  <TableCell className="text-zinc-300">{item.line_number}</TableCell>
                  <TableCell className="text-zinc-300">{item.part_number}</TableCell>
                  <TableCell className="text-zinc-300">{item.description || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCheckInLineItem(item.hd_order_number, item.line_number, 'Check In')}
                      className="text-zinc-400 hover:text-green-500 hover:bg-zinc-800 mr-2"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      <span>Check In</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredLineItems.length > 25 && (
            <p className="text-center text-zinc-400 mt-4">
              Showing 25 of {filteredLineItems.length} line items. Use the search to find specific items.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AwaitingLineItemsList;
