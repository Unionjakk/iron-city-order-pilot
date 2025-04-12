
import * as XLSX from 'xlsx';

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
}

export const parseExcelFile = async (file: File): Promise<OrderLineItem[]> => {
  console.log('Parsing file:', file.name);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Failed to read file data'));
          return;
        }
        
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { raw: false });
        console.log('Raw Excel data:', jsonData);
        
        if (!jsonData || jsonData.length === 0) {
          reject(new Error('No data found in Excel file'));
          return;
        }

        // Map of all possible column name variations to standard names
        const columnMappings = {
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

          // Projected Shipping Date variations
          'PROJECTED SHIPPING DATE': 'projected_shipping_date',
          'PROJ SHIP DATE': 'projected_shipping_date',
          'SHIP DATE': 'projected_shipping_date',
          '*PROJECTED SHIPPING DATE': 'projected_shipping_date',

          // Projected Shipping Quantity variations
          'PROJECTED SHIPPING QUANTITY': 'projected_shipping_quantity',
          'PROJECTED SHIPPING QTY': 'projected_shipping_quantity',
          'PROJ SHIPPING QTY': 'projected_shipping_quantity',
          '*PROJECTED SHIPPING QTY': 'projected_shipping_quantity',
          'PROJECTED SHIPPING': 'projected_shipping_quantity',
          'PROJ SHIP QTY': 'projected_shipping_quantity',
          'SHIP QTY': 'projected_shipping_quantity'
        };

        // Find the actual column names from the first row
        const actualColumnNames: Record<string, string> = {};
        if (jsonData.length > 0) {
          const firstRow = jsonData[0];
          for (const key in firstRow) {
            for (const possibleName in columnMappings) {
              if (key.toUpperCase() === possibleName) {
                actualColumnNames[columnMappings[possibleName]] = key;
                break;
              }
            }
          }
        }
        
        console.log('Detected column mappings:', actualColumnNames);
        
        const mappedData: OrderLineItem[] = jsonData.map(row => {
          // Find the correct column for HD Order Number
          let hdOrderNumber = '';
          for (const col of ['HD ORDER NUMBER', 'ORDER NUMBER', 'SALES ORDER', 'HD ORDER', 'ORDER #']) {
            if (row[col] !== undefined) {
              hdOrderNumber = row[col];
              break;
            }
          }
          
          // Find the correct column for Line Number
          let lineNumber = '';
          for (const col of ['LINE NUMBER', 'LINE', 'LINE #', '*LINE']) {
            if (row[col] !== undefined) {
              lineNumber = row[col];
              break;
            }
          }
          
          // Find the correct column for Part Number
          let partNumber = '';
          for (const col of ['PART NUMBER', 'PART', 'PART #', 'PART NO', '*PART NUMBER']) {
            if (row[col] !== undefined) {
              partNumber = row[col];
              break;
            }
          }
          
          // Find the correct column for Dealer PO Number
          let dealerPoNumber = '';
          for (const col of ['DEALER PO NUMBER', 'PO NUMBER', 'PURCHASE ORDER', 'DEALER PO', 'CUST PO', '*DEALER PO NUMBER']) {
            if (row[col] !== undefined) {
              dealerPoNumber = row[col];
              break;
            }
          }

          // Find the correct column for Backorder Clear By
          let backorderClearBy = '';
          for (const col of ['BACKORDER CLEAR BY', 'B/O CLEAR BY', 'BO CLEAR', 'BO CLEAR BY', '*B/O CLEAR', 'CLEAR BY', 'B/O CLEAR DATE']) {
            if (row[col] !== undefined) {
              backorderClearBy = row[col];
              break;
            }
          }

          // Find the correct column for Projected Shipping Quantity
          let projectedShippingQty = '';
          for (const col of ['PROJECTED SHIPPING QUANTITY', 'PROJECTED SHIPPING QTY', 'PROJ SHIPPING QTY', 
                            '*PROJECTED SHIPPING QTY', 'PROJECTED SHIPPING', 'PROJ SHIP QTY', 'SHIP QTY']) {
            if (row[col] !== undefined) {
              projectedShippingQty = row[col];
              break;
            }
          }
          
          // Convert line number to string
          const lineNumberStr = String(lineNumber);
          
          // Convert backorder clear by to a date string if it exists
          const backorderClearByDate = backorderClearBy ? backorderClearBy : null;
          
          // Log the found dealer PO number and backorder clear by to debug
          if (dealerPoNumber) {
            console.log(`Found dealer PO number: ${dealerPoNumber} for order: ${hdOrderNumber}, line: ${lineNumberStr}`);
          }
          
          if (backorderClearByDate) {
            console.log(`Found backorder clear by: ${backorderClearByDate} for order: ${hdOrderNumber}, line: ${lineNumberStr}`);
          }

          if (projectedShippingQty) {
            console.log(`Found projected shipping quantity: ${projectedShippingQty} for order: ${hdOrderNumber}, line: ${lineNumberStr}`);
          }
          
          if (!hdOrderNumber || !partNumber) {
            console.warn('Missing required fields in row:', row);
          }
          
          return {
            hd_order_number: hdOrderNumber,
            line_number: lineNumberStr,
            part_number: partNumber,
            description: row['DESCRIPTION'] || row['PART DESCRIPTION'] || row['*DESCRIPTION'] || '',
            order_quantity: parseFloat(String(row['ORDER QUANTITY'] || row['ORDER QTY'] || '0').replace(/[^0-9.]/g, '')) || 0,
            open_quantity: parseFloat(String(row['OPEN QUANTITY'] || row['OPEN QTY'] || '0').replace(/[^0-9.]/g, '')) || 0,
            unit_price: parseFloat(String(row['UNIT PRICE'] || row['PRICE'] || '0').replace(/[^0-9.]/g, '')) || 0,
            total_price: parseFloat(String(row['TOTAL PRICE'] || row['TOTAL'] || row['*TOTAL'] || '0').replace(/[^0-9.]/g, '')) || 0,
            status: row['STATUS'] || '',
            dealer_po_number: dealerPoNumber, 
            order_date: row['ORDER DATE'] || row['DATE'] || null,
            backorder_clear_by: backorderClearByDate,
            projected_shipping_quantity: projectedShippingQty
          };
        }).filter(item => item.hd_order_number && item.part_number);
        
        console.log('Mapped data:', mappedData);
        resolve(mappedData);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      reject(error);
    };
    
    reader.readAsBinaryString(file);
  });
};
