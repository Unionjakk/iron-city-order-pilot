
import { ColumnMappings } from './types';

/**
 * Map of all possible column name variations to standard names
 */
export const columnMappings: ColumnMappings = {
  // HD Order Number variations
  'HD ORDER NUMBER': 'hd_order_number',
  'ORDER NUMBER': 'hd_order_number',
  'SALES ORDER': 'hd_order_number',
  'HD ORDER': 'hd_order_number',
  'ORDER #': 'hd_order_number',
  
  // Line Number variations
  'LINE NUMBER': 'line_number',
  'LINE': 'line_number',
  'LINE #': 'line_number',
  '*LINE': 'line_number',
  
  // Part Number variations
  'PART NUMBER': 'part_number',
  'PART': 'part_number',
  'PART #': 'part_number',
  'PART NO': 'part_number',
  '*PART NUMBER': 'part_number',
  
  // Description variations
  'DESCRIPTION': 'description',
  'PART DESCRIPTION': 'description',
  '*DESCRIPTION': 'description',
  
  // Order Quantity variations
  'ORDER QUANTITY': 'order_quantity',
  'ORDER QTY': 'order_quantity',
  'QUANTITY': 'order_quantity',
  
  // Open Quantity variations
  'OPEN QUANTITY': 'open_quantity',
  'OPEN QTY': 'open_quantity',
  
  // Unit Price variations
  'UNIT PRICE': 'unit_price',
  'PRICE': 'unit_price',
  
  // Total Price variations
  'TOTAL PRICE': 'total_price',
  'TOTAL': 'total_price',
  '*TOTAL': 'total_price',
  
  // Status variations
  'STATUS': 'status',
  
  // Dealer PO Number variations
  'DEALER PO NUMBER': 'dealer_po_number',
  'PO NUMBER': 'dealer_po_number',
  'PURCHASE ORDER': 'dealer_po_number',
  'DEALER PO': 'dealer_po_number',
  'CUST PO': 'dealer_po_number',
  '*DEALER PO NUMBER': 'dealer_po_number',
  'CUSTOMER PO': 'dealer_po_number',
  'DEALER PO#': 'dealer_po_number',
  
  // Order Date variations
  'ORDER DATE': 'order_date',
  'DATE': 'order_date',
  'ORDER': 'order_date',

  // Invoice Number variations
  'INVOICE NUMBER': 'invoice_number',
  'INVOICE #': 'invoice_number',
  'INVOICE': 'invoice_number',
  'INV NUMBER': 'invoice_number',
  'INV #': 'invoice_number',
  '*INVOICE NUMBER': 'invoice_number',
  
  // Invoice Date variations
  'INVOICE DATE': 'invoice_date',
  'INV DATE': 'invoice_date',
  '*INVOICE DATE': 'invoice_date',

  // Backorder Clear By variations
  'BACKORDER CLEAR BY': 'backorder_clear_by',
  'B/O CLEAR BY': 'backorder_clear_by',
  'BO CLEAR': 'backorder_clear_by',
  'BO CLEAR BY': 'backorder_clear_by',
  '*B/O CLEAR': 'backorder_clear_by',
  'CLEAR BY': 'backorder_clear_by',
  'B/O CLEAR DATE': 'backorder_clear_by',
  'BACKORDER CLEAR': 'backorder_clear_by',
  'BACK ORDER CLEAR BY': 'backorder_clear_by',
  'CLEAR DATE': 'backorder_clear_by',

  // Projected Shipping Date variations
  'PROJECTED SHIPPING DATE': 'projected_shipping_date',
  'PROJ SHIP DATE': 'projected_shipping_date',
  'SHIP DATE': 'projected_shipping_date',
  '*PROJECTED SHIPPING DATE': 'projected_shipping_date',

  // Projected Shipping Quantity variations
  'PROJECTED SHIPPING QUANTITY': 'projected_shipping_quantity',
  'PROJ SHIPPING QTY': 'projected_shipping_quantity',
  '*PROJECTED SHIPPING QTY': 'projected_shipping_quantity',
  'PROJECTED SHIPPING': 'projected_shipping_quantity',
  'PROJ SHIP QTY': 'projected_shipping_quantity',
  'SHIP QTY': 'projected_shipping_quantity',
  'PROJECTED QTY': 'projected_shipping_quantity',
  'SHIPPING QTY': 'projected_shipping_quantity'
};
