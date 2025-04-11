
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ExcludedOrder, ExcludeReason } from '../types/excludeTypes';
import { toast } from 'sonner';

export const useExcludedOrders = () => {
  const [excludedOrders, setExcludedOrders] = useState<ExcludedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExcludedOrders = async () => {
    setIsLoading(true);
    try {
      // First fetch the exclusions
      const { data: exclusions, error: exclusionsError } = await supabase
        .from('hd_lineitems_exclude')
        .select(`
          id,
          hd_order_number,
          reason,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (exclusionsError) {
        throw exclusionsError;
      }

      // Now get the order details for each excluded order
      const transformedData: ExcludedOrder[] = [];
      
      for (const exclusion of exclusions) {
        // Get order details
        const { data: orderDetails, error: orderError } = await supabase
          .from('hd_orders')
          .select('dealer_po_number, order_type')
          .eq('hd_order_number', exclusion.hd_order_number)
          .maybeSingle();
        
        if (orderError) {
          console.error('Error fetching order details:', orderError);
        }
        
        transformedData.push({
          id: exclusion.id,
          hd_order_number: exclusion.hd_order_number,
          dealer_po_number: orderDetails?.dealer_po_number || '-',
          order_type: orderDetails?.order_type || '-',
          reason: exclusion.reason as ExcludeReason,
          created_at: exclusion.created_at
        });
      }

      setExcludedOrders(transformedData);
    } catch (error) {
      console.error('Error fetching excluded orders:', error);
      toast.error('Failed to load excluded orders');
    } finally {
      setIsLoading(false);
    }
  };

  const addExclusion = async (orderNumber: string, reason: ExcludeReason) => {
    try {
      // Check if order number already exists
      const { data: existingOrders, error: checkError } = await supabase
        .from('hd_lineitems_exclude')
        .select('id')
        .eq('hd_order_number', orderNumber);

      if (checkError) {
        throw checkError;
      }

      if (existingOrders && existingOrders.length > 0) {
        toast.error('This order number is already excluded');
        return;
      }

      const { error } = await supabase
        .from('hd_lineitems_exclude')
        .insert({ hd_order_number: orderNumber, reason });

      if (error) {
        throw error;
      }

      toast.success('Order excluded successfully');
      fetchExcludedOrders();
    } catch (error) {
      console.error('Error adding exclusion:', error);
      toast.error('Failed to exclude order');
    }
  };

  const removeExclusion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('hd_lineitems_exclude')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success('Exclusion removed successfully');
      fetchExcludedOrders();
    } catch (error) {
      console.error('Error removing exclusion:', error);
      toast.error('Failed to remove exclusion');
    }
  };

  useEffect(() => {
    fetchExcludedOrders();
  }, []);

  return {
    excludedOrders,
    isLoading,
    addExclusion,
    removeExclusion,
    excludedOrderNumbers: excludedOrders.map(order => order.hd_order_number),
    refreshExcludedOrders: fetchExcludedOrders
  };
};
