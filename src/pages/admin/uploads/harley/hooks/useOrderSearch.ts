
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useOrderSearch = (searchValue: string) => {
  const [orderNumbers, setOrderNumbers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOrderNumbers = async () => {
      if (searchValue.length < 2) {
        setOrderNumbers([]);
        return;
      }
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('hd_orders')
          .select('hd_order_number')
          .ilike('hd_order_number', `%${searchValue}%`)
          .limit(10);
        
        if (error) throw error;
        
        if (data && Array.isArray(data)) {
          // Safely map the data to strings
          const numbers = data.map(order => 
            order && typeof order.hd_order_number === 'string' 
              ? order.hd_order_number 
              : ''
          ).filter(Boolean); // Remove any empty strings
          
          setOrderNumbers(numbers);
        } else {
          setOrderNumbers([]);
        }
      } catch (error) {
        console.error('Error fetching order numbers:', error);
        toast.error('Failed to load order suggestions');
        setOrderNumbers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderNumbers();
  }, [searchValue]);

  return { orderNumbers, loading };
};
