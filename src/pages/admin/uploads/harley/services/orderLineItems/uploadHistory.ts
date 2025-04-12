
import { supabase } from '@/integrations/supabase/client';

/**
 * Record an upload in the history table
 */
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
