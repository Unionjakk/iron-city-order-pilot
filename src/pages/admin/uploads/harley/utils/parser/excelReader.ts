
import * as XLSX from 'xlsx';

/**
 * Read Excel file and return binary data
 */
export const readExcelFile = (file: File): Promise<string | ArrayBuffer> => {
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
export const convertExcelToJson = (data: string | ArrayBuffer): any[] => {
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
