
export type ExcludeReason = 'Check In' | 'Not Shopify';

export interface ExcludedOrder {
  id: string;
  hd_order_number: string;
  dealer_po_number: string;
  order_type: string;
  reason: ExcludeReason;
  created_at: string;
}
