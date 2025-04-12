import * as XLSX from 'xlsx';
import { 
  findColumnValue, 
  parseNumericValue, 
  detectColumnMappings, 
  processProjectedShippingQuantity 
} from './excelParserHelpers';

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
}

// Map of all possible column name variations to standard names
export const columnMappings = {
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

/**
 * Read Excel file and return binary data
 */
const readExcelFile = (file: File): Promise<string | ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) {
        reject(new Error('Failed to read file data'));
        return;
      }
      resolve(data);
    };
    
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      reject(error);
    };
    
    reader.readAsBinaryString(file);
  });
};

/**
 * Convert Excel data to JSON format
 */
const convertExcelToJson = (data: string | ArrayBuffer): any[] => {
  try {
    const workbook = XLSX.read(data, { type: 'binary' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { raw: false });
    console.log('Raw Excel data:', jsonData.slice(0, 2)); // Log first two rows for debugging
    
    if (!jsonData || jsonData.length === 0) {
      throw new Error('No data found in Excel file');
    }
    
    return jsonData;
  } catch (error) {
    console.error('Error converting Excel to JSON:', error);
    throw error;
  }
};

/**
 * Map row data to OrderLineItem structure
 */
const mapRowToOrderLineItem = (row: any): OrderLineItem => {
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
    projected_shipping_quantity: projectedShippingQty
  };
};

/**
 * Main function to parse Excel file to OrderLineItem[]
 */
export const parseExcelFile = async (file: File): Promise<OrderLineItem[]> => {
  console.log('Parsing file:', file.name);
  
  try {
    // Read the Excel file
    const data = await readExcelFile(file);
    
    // Convert to JSON
    const jsonData = convertExcelToJson(data);
    
    // Log raw column headers to identify potential issues
    if (jsonData.length > 0) {
      console.log('Available column headers in raw data:', Object.keys(jsonData[0]));
    }
    
    // Detect column mappings
    detectColumnMappings(jsonData, columnMappings);
    
    // Map each row to OrderLineItem and filter out invalid items
    const mappedData: OrderLineItem[] = jsonData
      .map(mapRowToOrderLineItem)
      .filter(item => item.hd_order_number && item.part_number);
    
    console.log('Mapped data (first 3 items):', mappedData.slice(0, 3));
    return mappedData;
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw error;
  }
};
