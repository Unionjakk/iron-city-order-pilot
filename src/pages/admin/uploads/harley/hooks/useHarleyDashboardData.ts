
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
          
          if (statsData) {
            // Update stats with data from database
            setStats({
              totalOrders: statsData.totalOrders || 0,
              ordersWithoutLineItems: statsData.ordersWithoutLineItems || 0,
              backorderItems: statsData.backorderItems || 0,
              lastOpenOrdersUpload: statsData.lastOpenOrdersUpload,
              lastLineItemsUpload: statsData.lastLineItemsUpload,
              lastBackordersUpload: statsData.lastBackordersUpload
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
            id: upload.id,
            upload_type: upload.upload_type,
            filename: upload.filename,
            upload_date: upload.upload_date,
            items_count: upload.items_count,
            status: upload.status
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
