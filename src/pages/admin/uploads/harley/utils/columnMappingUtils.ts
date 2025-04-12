
/**
 * Utility functions for working with Excel column mappings
 */

/**
 * Find a value in a row using various possible column names
 */
export const findColumnValue = (row: any, columnOptions: string[]): string => {
  for (const col of columnOptions) {
    if (row[col] !== undefined) {
      return row[col];
    }
  }
  return '';
};

/**
 * Parse a numeric value from string, removing non-numeric characters
 */
export const parseNumericValue = (value: any): number => {
  if (!value && value !== 0) return 0;
  
  try {
    // Remove any non-numeric characters except decimal point
    const numericStr = String(value).replace(/[^0-9.]/g, '');
    return parseFloat(numericStr) || 0;
  } catch (error) {
    console.warn('Error parsing numeric value:', value);
    return 0;
  }
};

/**
 * Detect actual column names from the data based on provided mappings
 */
export const detectColumnMappings = (
  jsonData: any[], 
  columnMappings: Record<string, string>
): Record<string, string> => {
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
  return actualColumnNames;
};
