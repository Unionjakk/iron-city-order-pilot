
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
        
        const mappedData: OrderLineItem[] = jsonData.map(row => {
          const hdOrderNumber = row['HD ORDER NUMBER'] || row['ORDER NUMBER'] || row['SALES ORDER'] || '';
          const lineNumber = row['LINE NUMBER'] || row['LINE'] || row['LINE #'] || '';
          const partNumber = row['PART NUMBER'] || row['PART'] || row['PART #'] || row['PART NO'] || '';
          const lineNumberStr = String(lineNumber);
          
          // More extensive matching for dealer PO number field
          const dealerPoNumber = row['DEALER PO NUMBER'] || row['PO NUMBER'] || row['PURCHASE ORDER'] || row['DEALER PO'] || row['CUST PO'] || '';
          
          if (!hdOrderNumber || !partNumber) {
            console.warn('Missing required fields in row:', row);
          }
          
          // Log the dealer PO number to debug
          if (dealerPoNumber) {
            console.log(`Found dealer PO number: ${dealerPoNumber} for order: ${hdOrderNumber}, line: ${lineNumberStr}`);
          } else {
            console.log(`No dealer PO number found for order: ${hdOrderNumber}, line: ${lineNumberStr}`);
            console.log('Row keys:', Object.keys(row));
          }
          
          return {
            hd_order_number: hdOrderNumber,
            line_number: lineNumberStr,
            part_number: partNumber,
            description: row['DESCRIPTION'] || row['PART DESCRIPTION'] || '',
            order_quantity: parseFloat(row['ORDER QUANTITY'] || row['ORDER QTY'] || '0'),
            open_quantity: parseFloat(row['OPEN QUANTITY'] || row['OPEN QTY'] || '0'),
            unit_price: parseFloat(row['UNIT PRICE'] || row['PRICE'] || '0'),
            total_price: parseFloat(row['TOTAL PRICE'] || row['TOTAL'] || '0'),
            status: row['STATUS'] || '',
            dealer_po_number: dealerPoNumber, 
            order_date: row['ORDER DATE'] || null
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
