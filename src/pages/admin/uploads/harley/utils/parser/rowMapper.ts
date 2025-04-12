
import { OrderLineItem } from './types';
import { findColumnValue, parseNumericValue, processProjectedShippingQuantity } from '../excelParserHelpers';

/**
 * Map row data to OrderLineItem structure
 */
export const mapRowToOrderLineItem = (row: any): OrderLineItem => {
  // Debug the entire row to see what we're working with
  console.log('Processing row:', row);

  // Find the correct column for HD Order Number
  const hdOrderNumber = findColumnValue(row, [
    'HD ORDER NUMBER', 'ORDER NUMBER', 'SALES ORDER', 'HD ORDER', 'ORDER #'
  ]);
  
  // Find the correct column for Line Number
  const lineNumber = findColumnValue(row, [
    'LINE NUMBER', 'LINE', 'LINE #', '*LINE'
  ]);
  
  // Find the correct column for Part Number
  const partNumber = findColumnValue(row, [
    'PART NUMBER', 'PART', 'PART #', 'PART NO', '*PART NUMBER'
  ]);
  
  // Find the correct column for Dealer PO Number
  const dealerPoNumber = findColumnValue(row, [
    'DEALER PO NUMBER', 'PO NUMBER', 'PURCHASE ORDER', 'DEALER PO', 
    'CUST PO', '*DEALER PO NUMBER', 'CUSTOMER PO', 'DEALER PO#'
  ]);

  // Find the correct column for Invoice Number
  const invoiceNumber = findColumnValue(row, [
    'INVOICE NUMBER', 'INVOICE #', 'INVOICE', 'INV NUMBER', 'INV #', '*INVOICE NUMBER'
  ]);
  
  // Find the correct column for Invoice Date
  const invoiceDate = findColumnValue(row, [
    'INVOICE DATE', 'INV DATE', '*INVOICE DATE'
  ]);

  // Find the correct column for Backorder Clear By
  const backorderClearBy = findColumnValue(row, [
    'BACKORDER CLEAR BY', 'B/O CLEAR BY', 'BO CLEAR', 'BO CLEAR BY', 
    '*B/O CLEAR', 'CLEAR BY', 'B/O CLEAR DATE', 'BACKORDER CLEAR', 
    'BACK ORDER CLEAR BY', 'CLEAR DATE'
  ]);

  // Process projected shipping quantity
  const projectedShippingQty = processProjectedShippingQuantity(row);
  
  // Convert line number to string
  const lineNumberStr = String(lineNumber);
  
  // Log the found values to debug
  console.log(`Found values for order: ${hdOrderNumber}, line: ${lineNumberStr}:`);
  console.log(`  Dealer PO: ${dealerPoNumber}`);
  console.log(`  Invoice Number: ${invoiceNumber}`);
  console.log(`  Invoice Date: ${invoiceDate}`);
  console.log(`  Backorder clear by: ${backorderClearBy}`);
  console.log(`  Projected shipping qty: ${projectedShippingQty}`);
  
  if (!hdOrderNumber || !partNumber) {
    console.warn('Missing required fields in row:', row);
  }
  
  return {
    hd_order_number: hdOrderNumber,
    line_number: lineNumberStr,
    part_number: partNumber,
    description: row['DESCRIPTION'] || row['PART DESCRIPTION'] || row['*DESCRIPTION'] || '',
    order_quantity: parseNumericValue(row['ORDER QUANTITY'] || row['ORDER QTY'] || row['QUANTITY'] || '0'),
    open_quantity: parseNumericValue(row['OPEN QUANTITY'] || row['OPEN QTY'] || '0'),
    unit_price: parseNumericValue(row['UNIT PRICE'] || row['PRICE'] || '0'),
    total_price: parseNumericValue(row['TOTAL PRICE'] || row['TOTAL'] || row['*TOTAL'] || '0'),
    status: row['STATUS'] || '',
    dealer_po_number: dealerPoNumber || '', 
    order_date: row['ORDER DATE'] || row['DATE'] || null,
    backorder_clear_by: backorderClearBy || null,
    projected_shipping_quantity: projectedShippingQty,
    invoice_number: invoiceNumber || '',
    invoice_date: invoiceDate || null
  };
};
