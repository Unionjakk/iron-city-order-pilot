
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch the total quantity picked for a specific SKU across all orders
 */
export const fetchTotalPickedQuantityForSku = async (sku: string): Promise<number | null> => {
  try {
    const { data, error } = await supabase
      .from('iron_city_order_progress')
      .select('quantity_picked')
      .eq('sku', sku)
      .eq('progress', 'Picked');
    
    if (error) {
      console.error('Error fetching picked quantity:', error);
      return null;
    }
    
    // Sum up the quantity_picked values
    const totalPicked = data.reduce((sum, item) => {
      return sum + (item.quantity_picked || 0);
    }, 0);
    
    return totalPicked;
  } catch (err) {
    console.error('Unexpected error fetching picked quantity:', err);
    return null;
  }
};
