
import { OrderLineItem } from './types';
import { columnMappings } from './columnMappings';
import { readExcelFile, convertExcelToJson } from './excelReader';
import { mapRowToOrderLineItem } from './rowMapper';
import { detectColumnMappings } from '../excelParserHelpers';

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
