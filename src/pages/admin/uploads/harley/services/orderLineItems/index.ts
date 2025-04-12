
import { OrderLineItem } from '../../utils/parser';
import { UploadStats } from './types';
import { processOrderData } from './orderProcessor';
import { recordUploadHistory } from './uploadHistory';

/**
 * Process all order line items from a parsed data set
 */
export const processOrderLineItems = async (
  parsedData: OrderLineItem[],
  stats: UploadStats,
  updateStats: (newStats: UploadStats) => void
) => {
  if (parsedData.length === 0) {
    console.warn('No data to process');
    return;
  }
  
  let totalLinesProcessed = stats.processed;
  let totalLinesReplaced = stats.replaced;
  let totalErrors = stats.errors;
  
  const hdOrderNumbers = [...new Set(parsedData.map(item => item.hd_order_number))];
  console.log('Found order numbers in file:', hdOrderNumbers);
  
  for (const hdOrderNumber of hdOrderNumbers) {
    const lineItems = parsedData.filter(item => item.hd_order_number === hdOrderNumber);
    
    const result = await processOrderData(hdOrderNumber, lineItems);
    
    totalLinesProcessed += result.processedCount;
    totalLinesReplaced += result.replacedLineNumbers.length;
    totalErrors += result.errorsCount;
    
    // Update stats as we process each order
    updateStats({
      processed: totalLinesProcessed,
      replaced: totalLinesReplaced,
      errors: totalErrors
    });
  }
};

// Re-export for backward compatibility
export { recordUploadHistory } from './uploadHistory';
export type { UploadStats } from './types';
