
import { supabase } from '@/integrations/supabase/client';
import { OrderLineItem } from '../../utils/parser';
import { processOrderData } from './orderProcessor';
import { UploadStats } from './types';

/**
 * Process line items from Excel import data and update database
 */
export const processOrderLineItems = async (
  parsedData: OrderLineItem[],
  currentStats: UploadStats,
  updateStats: (stats: UploadStats) => void
): Promise<void> => {
  // Group items by HD order number for batch processing
  const orderMap = new Map<string, OrderLineItem[]>();
  
  parsedData.forEach(item => {
    const hdOrderNumber = item.hd_order_number;
    if (!hdOrderNumber) {
      console.warn('Skipping line item without HD order number:', item);
      return;
    }
    
    if (!orderMap.has(hdOrderNumber)) {
      orderMap.set(hdOrderNumber, []);
    }
    orderMap.get(hdOrderNumber)?.push(item);
  });
  
  console.log(`Grouped ${parsedData.length} line items into ${orderMap.size} orders`);
  
  let processedCount = currentStats.processed;
  let replacedCount = currentStats.replaced;
  let errorsCount = currentStats.errors;
  
  // Process each order's line items
  for (const [hdOrderNumber, lineItems] of orderMap.entries()) {
    try {
      const result = await processOrderData(hdOrderNumber, lineItems);
      
      processedCount += result.processedCount;
      errorsCount += result.errorsCount;
      
      if (result.replacedLineNumbers.length > 0) {
        replacedCount += result.replacedLineNumbers.length;
      }
      
      // Update stats after each order to show progress
      updateStats({
        processed: processedCount,
        replaced: replacedCount,
        errors: errorsCount
      });
      
    } catch (error) {
      console.error(`Error processing order ${hdOrderNumber}:`, error);
      errorsCount++;
      
      updateStats({
        processed: processedCount,
        replaced: replacedCount,
        errors: errorsCount
      });
    }
  }
  
  console.log(`Completed processing ${processedCount} line items with ${errorsCount} errors`);
};
