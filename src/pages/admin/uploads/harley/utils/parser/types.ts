
/**
 * Type definitions for Excel parser functionality
 */

export interface OrderLineItem {
  hd_order_number: string;
  line_number: string | number;
  part_number: string;
  description?: string;
  order_quantity?: number;
  open_quantity?: number;
  unit_price?: number;
  total_price?: number;
  status?: string;
  dealer_po_number?: string;
  order_date?: string | Date;
  backorder_clear_by?: string | Date;
  projected_shipping_quantity?: number;
  invoice_number?: string;
  invoice_date?: string | Date;
}

// Map of all possible column name variations to standard names
export type ColumnMappings = Record<string, string>;
