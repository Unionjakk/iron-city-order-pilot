
import { supabase } from '@/integrations/supabase/client';
import { OrderLineItem } from '../utils/excelParser';

export interface UploadStats {
  processed: number;
  replaced: number;
  errors: number;
}

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
    console.log(`Processing line items for order: ${hdOrderNumber}`);
    
    const lineItems = parsedData.filter(item => item.hd_order_number === hdOrderNumber);
    
    // Find the corresponding order to get its ID (without relying on foreign keys)
    const { data: existingOrders, error: fetchError } = await supabase
      .from('hd_orders')
      .select('id')
      .eq('hd_order_number', hdOrderNumber)
      .limit(1);
    
    if (fetchError) {
      console.error(`Error fetching order ${hdOrderNumber}:`, fetchError);
      totalErrors++;
      continue;
    }
    
    if (!existingOrders || existingOrders.length === 0) {
      console.warn(`Order ${hdOrderNumber} not found in database. Skipping its line items.`);
      totalErrors++;
      continue;
    }
    
    const orderId = existingOrders[0].id;
    
    // Check if there are existing line items for this order
    const { data: existingLineItems, error: lineItemsError } = await supabase
      .from('hd_order_line_items')
      .select('id, line_number')
      .eq('hd_order_number', hdOrderNumber);
    
    if (lineItemsError) {
      console.error(`Error fetching existing line items for order ${hdOrderNumber}:`, lineItemsError);
      totalErrors++;
      continue;
    }
    
    const existingLineNumbers = new Map();
    existingLineItems?.forEach(item => existingLineNumbers.set(item.line_number, item.id));
    
    const replacedLineNumbers: string[] = [];
    
    // First delete existing line items for this order
    const { error: deleteError } = await supabase
      .from('hd_order_line_items')
      .delete()
      .eq('hd_order_number', hdOrderNumber);
    
    if (deleteError) {
      console.error(`Error deleting existing line items for order ${hdOrderNumber}:`, deleteError);
      totalErrors++;
      continue;
    }
    
    // Insert all the line items
    for (const item of lineItems) {
      const lineNumberStr = String(item.line_number);
      const orderDate = item.order_date ? 
        (item.order_date instanceof Date ? 
          item.order_date.toISOString().split('T')[0] : 
          String(item.order_date)) : 
        null;
      
      // Process backorder fields if they exist in the order line item
      const backorderClearBy = item.backorder_clear_by ? 
        (item.backorder_clear_by instanceof Date ? 
          item.backorder_clear_by.toISOString().split('T')[0] : 
          String(item.backorder_clear_by)) : 
        null;
        
      const projectedShippingQuantity = item.projected_shipping_quantity || 0;
      
      // Log dealer PO number to debug
      console.log(`Inserting line item with dealer PO number: ${item.dealer_po_number || 'NONE'}`);
      
      if (existingLineNumbers.has(lineNumberStr)) {
        replacedLineNumbers.push(lineNumberStr);
        totalLinesReplaced++;
      }
      
      // Ensure dealer_po_number is explicitly set even if it's an empty string
      const dealerPoNumber = item.dealer_po_number || '';
      
      // IMPORTANT: Always include both hd_order_id and hd_order_number to maintain proper relationship
      const { error: insertError } = await supabase
        .from('hd_order_line_items')
        .insert({
          hd_order_id: orderId,  // This is the key change - we always set the order ID explicitly
          hd_order_number: hdOrderNumber,
          line_number: lineNumberStr,
          part_number: item.part_number || '',
          description: item.description || '',
          order_quantity: item.order_quantity || 0,
          open_quantity: item.open_quantity || 0,
          unit_price: item.unit_price || 0,
          total_price: item.total_price || 0,
          status: item.status || '',
          dealer_po_number: dealerPoNumber,
          order_date: orderDate,
          backorder_clear_by: backorderClearBy,
          projected_shipping_quantity: projectedShippingQuantity
        });
      
      if (insertError) {
        console.error(`Error inserting line item for order ${hdOrderNumber}:`, insertError);
        totalErrors++;
        continue;
      }
      
      totalLinesProcessed++;
    }
    
    if (replacedLineNumbers.length > 0) {
      console.log(`Replaced ${replacedLineNumbers.length} existing line items for order ${hdOrderNumber}: ${replacedLineNumbers.join(', ')}`);
    }
    
    // Update the has_line_items flag for the order
    const { error: updateError } = await supabase
      .from('hd_orders')
      .update({ has_line_items: true })
      .eq('id', orderId);
    
    if (updateError) {
      console.error(`Error updating has_line_items for order ${hdOrderNumber}:`, updateError);
      totalErrors++;
    }
    
    console.log(`Successfully processed ${lineItems.length} line items for order ${hdOrderNumber}`);
    
    // Update stats as we process each order
    updateStats({
      processed: totalLinesProcessed,
      replaced: totalLinesReplaced,
      errors: totalErrors
    });
  }
};

export const recordUploadHistory = async (
  filename: string,
  itemsCount: number,
  replacedPrevious: boolean
): Promise<void> => {
  const { error: historyError } = await supabase
    .from('hd_upload_history')
    .insert({
      upload_type: 'order_lines',
      filename: filename,
      items_count: itemsCount,
      status: 'success',
      replaced_previous: replacedPrevious
    });
  
  if (historyError) {
    console.error('Error recording upload history:', historyError);
  }
};
