
// Type definitions for the order exclusion feature
export type ExcludeReason = 'Check In' | 'Not Shopify';

export type ExcludedOrder = {
  id: string;
  hd_order_number: string;
  dealer_po_number?: string;
  order_type?: string;
  reason: ExcludeReason;
  created_at: string;
};
