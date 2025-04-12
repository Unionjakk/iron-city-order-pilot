
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ExcludedLineItem, ExcludeReason } from '../types/excludeTypes';
import { toast } from 'sonner';

export const useExcludedLineItems = () => {
  const [excludedLineItems, setExcludedLineItems] = useState<ExcludedLineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExcludedLineItems = async () => {
    setIsLoading(true);
    try {
      // First fetch the exclusions
      const { data: exclusions, error: exclusionsError } = await supabase
        .from('hd_line_items_exclude')
        .select(`
          id,
          hd_order_number,
          line_number,
          part_number,
          hd_orderlinecombo,
          reason,
          created_at
        `)
        .not('line_number', 'is', null)
        .order('created_at', { ascending: false });

      if (exclusionsError) {
        throw exclusionsError;
      }

      // Now get the line item details for each excluded line
      const transformedData: ExcludedLineItem[] = [];
      
      for (const exclusion of exclusions) {
        // Get line item details if they exist
        const { data: lineItemDetails, error: lineItemError } = await supabase
          .from('hd_order_line_items')
          .select('part_number, description')
          .eq('hd_order_number', exclusion.hd_order_number)
          .eq('line_number', exclusion.line_number)
          .maybeSingle();
        
        if (lineItemError) {
          console.error('Error fetching line item details:', lineItemError);
        }
        
        transformedData.push({
          id: exclusion.id,
          hd_order_number: exclusion.hd_order_number,
          line_number: exclusion.line_number,
          part_number: exclusion.part_number || lineItemDetails?.part_number || '-',
          description: lineItemDetails?.description || '-',
          reason: exclusion.reason as ExcludeReason,
          created_at: exclusion.created_at,
          hd_orderlinecombo: exclusion.hd_orderlinecombo
        });
      }

      setExcludedLineItems(transformedData);
    } catch (error) {
      console.error('Error fetching excluded line items:', error);
      toast.error('Failed to load excluded line items');
    } finally {
      setIsLoading(false);
    }
  };

  const addExclusion = async (orderNumber: string, lineNumber: string, partNumber: string, reason: ExcludeReason) => {
    try {
      // Check if the combination already exists
      const { data: existingItems, error: checkError } = await supabase
        .from('hd_line_items_exclude')
        .select('id')
        .eq('hd_order_number', orderNumber)
        .eq('line_number', lineNumber);

      if (checkError) {
        throw checkError;
      }

      if (existingItems && existingItems.length > 0) {
        toast.error('This order line is already excluded');
        return;
      }

      const { error } = await supabase
        .from('hd_line_items_exclude')
        .insert({ 
          hd_order_number: orderNumber, 
          line_number: lineNumber,
          part_number: partNumber,
          reason 
        });

      if (error) {
        throw error;
      }

      toast.success('Order line excluded successfully');
      fetchExcludedLineItems();
    } catch (error) {
      console.error('Error adding line item exclusion:', error);
      toast.error('Failed to exclude order line');
    }
  };

  const removeExclusion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('hd_line_items_exclude')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success('Line item exclusion removed successfully');
      fetchExcludedLineItems();
    } catch (error) {
      console.error('Error removing line item exclusion:', error);
      toast.error('Failed to remove exclusion');
    }
  };

  useEffect(() => {
    fetchExcludedLineItems();
  }, []);

  return {
    excludedLineItems,
    isLoading,
    addExclusion,
    removeExclusion,
    excludedLineItemKeys: excludedLineItems.map(item => `${item.hd_order_number}-${item.line_number}`),
    excludedOrderLineCombos: excludedLineItems.map(item => item.hd_orderlinecombo || ''),
    refreshExcludedLineItems: fetchExcludedLineItems
  };
};
