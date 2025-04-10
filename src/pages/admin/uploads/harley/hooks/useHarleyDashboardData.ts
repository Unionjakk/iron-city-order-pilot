
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { HDStats, HDUploadHistory } from '../types/harleyTypes';

export const useHarleyDashboardData = () => {
  // Stats state
  const [stats, setStats] = useState<HDStats>({
    totalOrders: 0,
    ordersWithoutLineItems: 0,
    backorderItems: 0,
    lastOpenOrdersUpload: null,
    lastLineItemsUpload: null,
    lastBackordersUpload: null
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Recent uploads state
  const [recentUploads, setRecentUploads] = useState<HDUploadHistory[]>([]);
  const [isLoadingUploads, setIsLoadingUploads] = useState(true);

  // Fetch Harley Davidson import statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true);
        console.log("Fetching Harley Davidson statistics...");
        
        // Use execute_sql to run a custom query that calls our function
        const { data, error } = await supabase
          .rpc('execute_sql', { 
            sql: 'SELECT * FROM get_hd_stats()' 
          });
        
        if (error) {
          console.error('Error fetching Harley Davidson stats:', error);
          toast.error('Failed to load Harley Davidson statistics');
          setIsLoadingStats(false);
          return;
        }
        
        console.log('Received HD stats:', data);
        
        // Parse the JSON result from the function
        if (data && data.length > 0) {
          // The function returns an object in the first row
          const statsData = data[0];
          
          if (statsData && typeof statsData === 'object') {
            // Type assertion to help TypeScript understand the shape
            // Extract each property safely with fallbacks
            const statsObj = statsData as Record<string, any>;
            
            // Update stats with data from database
            setStats({
              totalOrders: typeof statsObj.totalOrders === 'number' ? statsObj.totalOrders : 0,
              ordersWithoutLineItems: typeof statsObj.ordersWithoutLineItems === 'number' ? statsObj.ordersWithoutLineItems : 0,
              backorderItems: typeof statsObj.backorderItems === 'number' ? statsObj.backorderItems : 0,
              lastOpenOrdersUpload: typeof statsObj.lastOpenOrdersUpload === 'string' ? statsObj.lastOpenOrdersUpload : null,
              lastLineItemsUpload: typeof statsObj.lastLineItemsUpload === 'string' ? statsObj.lastLineItemsUpload : null,
              lastBackordersUpload: typeof statsObj.lastBackordersUpload === 'string' ? statsObj.lastBackordersUpload : null
            });
          }
        }
        
        setIsLoadingStats(false);
      } catch (error) {
        console.error('Error fetching Harley Davidson stats:', error);
        toast.error('Failed to load Harley Davidson statistics');
        setIsLoadingStats(false);
      }
    };
    
    fetchStats();
  }, []);
  
  // Get recent uploads for the activity log
  useEffect(() => {
    const fetchRecentUploads = async () => {
      try {
        setIsLoadingUploads(true);
        
        // Use execute_sql to fetch the recent uploads
        const { data, error } = await supabase
          .rpc('execute_sql', {
            sql: `SELECT id, upload_type, filename, upload_date, items_count, status
                  FROM hd_upload_history
                  ORDER BY upload_date DESC LIMIT 5`
          });
        
        if (error) {
          console.error('Error fetching recent uploads:', error);
          setIsLoadingUploads(false);
          return;
        }
        
        console.log('Recent uploads:', data);
        
        // Convert the data to our typed array
        if (data && Array.isArray(data)) {
          const typedUploads: HDUploadHistory[] = data.map((upload: any) => ({
            id: String(upload.id),
            upload_type: String(upload.upload_type),
            filename: String(upload.filename),
            upload_date: String(upload.upload_date),
            items_count: Number(upload.items_count),
            status: String(upload.status)
          }));
          
          setRecentUploads(typedUploads);
        } else {
          setRecentUploads([]);
        }
        
        setIsLoadingUploads(false);
      } catch (error) {
        console.error('Error fetching recent uploads:', error);
        setIsLoadingUploads(false);
      }
    };
    
    fetchRecentUploads();
  }, []);

  return {
    stats,
    isLoadingStats,
    recentUploads,
    isLoadingUploads
  };
};
