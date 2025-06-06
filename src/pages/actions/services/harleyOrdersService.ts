import { supabase } from "@/integrations/supabase/client";
import { HarleyOrderMatch } from "../components/harley-orders/HarleyOrdersTable";

export const searchHarleyOrders = async (searchSku: string): Promise<HarleyOrderMatch[]> => {
  try {
    // Search the hd_order_matches view for matching part_number
    const { data, error } = await supabase
      .from('hd_order_matches')
      .select('hd_order_number, part_number, dealer_po_number, order_quantity, matched_quantity, status, hd_orderlinecombo, order_date, expected_arrival_dealership')
      .eq('part_number', searchSku)
      .order('hd_order_number', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Error searching Harley orders:", error);
    throw error;
  }
};

type OrderUpdateParams = {
  hd_orderlinecombo: string;
  status: string;
  dealer_po_number: string;
  hd_order_number: string;
};

export const matchToHarleyOrder = async (
  order: OrderUpdateParams,
  shopifyLineItemId: string,
  sku: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('iron_city_order_progress')
      .update({
        progress: "Ordered",
        hd_orderlinecombo: order.hd_orderlinecombo,
        status: order.status,
        dealer_po_number: order.dealer_po_number,
        notes: `Matched to HD order: ${order.hd_order_number} | ${new Date().toISOString().slice(0, 10)}`
      })
      .eq('shopify_line_item_id', shopifyLineItemId)
      .eq('sku', sku);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error matching to order:", error);
    throw error;
  }
};
