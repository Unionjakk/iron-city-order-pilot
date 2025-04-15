
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export const usePinnacleLastUpload = () => {
  const [lastUpload, setLastUpload] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLastUpload = async () => {
      try {
        const { data, error } = await supabase
          .from('pinnacle_upload_history')
          .select('upload_timestamp')
          .order('upload_timestamp', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          const timestamp = format(new Date(data[0].upload_timestamp), "MMM d, yyyy, h:mm a");
          setLastUpload(timestamp);
        }
      } catch (error) {
        console.error('Error fetching last upload:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLastUpload();
  }, []);

  return { lastUpload, isLoading };
};
