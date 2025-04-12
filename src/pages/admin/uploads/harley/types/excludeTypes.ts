
// Types for the order exclusion feature
export type ExcludeReason = 'Check In' | 'Not Shopify';

export type ExcludedOrder = {
  id: string;
  hd_order_number: string;
  dealer_po_number?: string;
  order_type?: string;
  reason: ExcludeReason;
  created_at: string;
};

// Types for the line item exclusion feature
export type ExcludedLineItem = {
  id: string;
  hd_order_number: string;
  line_number: string;
  part_number?: string;
  description?: string;
  reason: ExcludeReason;
  created_at: string;
  hd_orderlinecombo?: string;
};
