
/**
 * Utility functions for working with Excel column mappings
 */

/**
 * Find a value in a row using various possible column names
 */
export const findColumnValue = (row: any, columnOptions: string[]): string => {
  // Log all column options for debugging
  console.log(`Looking for columns: ${columnOptions.join(', ')}`);
  
  for (const col of columnOptions) {
    if (row[col] !== undefined) {
      console.log(`Found value in column "${col}": ${row[col]}`);
      return row[col];
    }
  }
  
  // Try case-insensitive matching if standard matching fails
  for (const col of columnOptions) {
    for (const key in row) {
      if (key.toUpperCase() === col.toUpperCase()) {
        console.log(`Found value in case-insensitive column "${key}": ${row[key]}`);
        return row[key];
      }
    }
  }
  
  console.log(`No value found for columns: ${columnOptions.join(', ')}`);
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
 * Detect actual column names from the data
 */
export const detectColumnMappings = (
  jsonData: any[], 
  columnMappings: Record<string, string>
): Record<string, string> => {
  const actualColumnNames: Record<string, string> = {};
  
  if (jsonData.length > 0) {
    const firstRow = jsonData[0];
    console.log('First row data:', firstRow);
    
    // Try exact matching
    for (const key in firstRow) {
      for (const possibleName in columnMappings) {
        if (key.toUpperCase() === possibleName) {
          actualColumnNames[columnMappings[possibleName]] = key;
          console.log(`Mapped column: ${key} -> ${columnMappings[possibleName]}`);
          break;
        }
      }
    }
    
    // Try fuzzy matching if exact matching fails for important columns
    const keysMapped = Object.values(actualColumnNames);
    
    if (!keysMapped.includes('dealer_po_number')) {
      console.log('Trying fuzzy matching for dealer_po_number...');
      for (const key in firstRow) {
        if (key.toUpperCase().includes('DEALER') && key.toUpperCase().includes('PO')) {
          actualColumnNames['dealer_po_number'] = key;
          console.log(`Fuzzy mapped dealer PO column: ${key} -> dealer_po_number`);
          break;
        }
      }
    }
    
    if (!keysMapped.includes('backorder_clear_by')) {
      console.log('Trying fuzzy matching for backorder_clear_by...');
      for (const key in firstRow) {
        if ((key.toUpperCase().includes('B/O') || key.toUpperCase().includes('BACKORDER')) && 
            (key.toUpperCase().includes('CLEAR') || key.toUpperCase().includes('DATE'))) {
          actualColumnNames['backorder_clear_by'] = key;
          console.log(`Fuzzy mapped backorder clear by column: ${key} -> backorder_clear_by`);
          break;
        }
      }
    }
    
    if (!keysMapped.includes('invoice_number')) {
      console.log('Trying fuzzy matching for invoice_number...');
      for (const key in firstRow) {
        if (key.toUpperCase().includes('INVOICE') && 
            (key.toUpperCase().includes('NUMBER') || key.toUpperCase().includes('#'))) {
          actualColumnNames['invoice_number'] = key;
          console.log(`Fuzzy mapped invoice number column: ${key} -> invoice_number`);
          break;
        }
      }
    }
    
    if (!keysMapped.includes('invoice_date')) {
      console.log('Trying fuzzy matching for invoice_date...');
      for (const key in firstRow) {
        if (key.toUpperCase().includes('INVOICE') && key.toUpperCase().includes('DATE')) {
          actualColumnNames['invoice_date'] = key;
          console.log(`Fuzzy mapped invoice date column: ${key} -> invoice_date`);
          break;
        }
      }
    }
  }
  
  console.log('Detected column mappings:', actualColumnNames);
  return actualColumnNames;
};

/**
 * Process projected shipping quantity from row
 */
export const processProjectedShippingQuantity = (row: any): number => {
  let projectedShippingQty = 0;
  const columnOptions = [
    'PROJECTED SHIPPING QUANTITY', 
    'PROJECTED SHIPPING QTY', 
    'PROJ SHIPPING QTY', 
    '*PROJECTED SHIPPING QTY', 
    'PROJECTED SHIPPING', 
    'PROJ SHIP QTY', 
    'SHIP QTY',
    'PROJECTED QTY', 
    'SHIPPING QTY'
  ];
  
  for (const col of columnOptions) {
    if (row[col] !== undefined) {
      try {
        const rawValue = row[col];
        console.log(`Converting shipping qty from "${rawValue}" to number`);
        // Remove any non-numeric characters except decimal point
        const numericStr = String(rawValue).replace(/[^0-9.]/g, '');
        projectedShippingQty = parseFloat(numericStr) || 0;
        
        // Ensure it's a whole number since it's a quantity
        projectedShippingQty = Math.round(projectedShippingQty);
        
        console.log(`Converted projected shipping qty: ${projectedShippingQty}`);
        break;
      } catch (err) {
        console.warn('Error parsing projected shipping quantity:', row[col]);
        projectedShippingQty = 0;
      }
    }
  }
  
  // Try case-insensitive matching if standard matching fails
  if (projectedShippingQty === 0) {
    for (const col of columnOptions) {
      for (const key in row) {
        if (key.toUpperCase() === col.toUpperCase()) {
          try {
            const rawValue = row[key];
            console.log(`Case-insensitive match: Converting shipping qty from "${rawValue}" to number`);
            // Remove any non-numeric characters except decimal point
            const numericStr = String(rawValue).replace(/[^0-9.]/g, '');
            projectedShippingQty = parseFloat(numericStr) || 0;
            
            // Ensure it's a whole number since it's a quantity
            projectedShippingQty = Math.round(projectedShippingQty);
            
            console.log(`Converted projected shipping qty: ${projectedShippingQty}`);
            break;
          } catch (err) {
            console.warn('Error parsing projected shipping quantity:', row[key]);
            projectedShippingQty = 0;
          }
        }
      }
      if (projectedShippingQty > 0) break;
    }
  }
  
  return projectedShippingQty;
};
