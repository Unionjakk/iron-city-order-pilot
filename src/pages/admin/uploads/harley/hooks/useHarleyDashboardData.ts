
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
    totalBackorderItems: 0,
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
        
        // Direct SQL query to calculate stats accurately
        const sqlQuery = `
          WITH order_counts AS (
            SELECT COUNT(*) AS total_orders FROM hd_orders
          ),
          orders_with_line_items AS (
            SELECT COUNT(DISTINCT o.id) AS with_line_items
            FROM hd_orders o
            WHERE o.hd_order_number IN (
              SELECT DISTINCT li.hd_order_number FROM hd_order_line_items li
            )
          ),
          backorder_counts AS (
            SELECT 
              COUNT(*) AS backorder_items
            FROM hd_order_line_items 
            WHERE is_backorder = true
          ),
          total_backorder_counts AS (
            SELECT 
              COUNT(*) AS total_backorder_items
            FROM hd_backorders
          ),
          last_uploads AS (
            SELECT 
              MAX(CASE WHEN upload_type = 'open_orders' AND status = 'success' THEN upload_date END) AS last_open_orders,
              MAX(CASE WHEN upload_type = 'order_lines' AND status = 'success' THEN upload_date END) AS last_line_items,
              MAX(CASE WHEN upload_type = 'backorders' AND status = 'success' THEN upload_date END) AS last_backorders
            FROM hd_upload_history
          )
          SELECT 
            order_counts.total_orders,
            (order_counts.total_orders - orders_with_line_items.with_line_items) AS orders_without_line_items,
            backorder_counts.backorder_items,
            total_backorder_counts.total_backorder_items,
            last_uploads.last_open_orders,
            last_uploads.last_line_items,
            last_uploads.last_backorders
          FROM
            order_counts,
            orders_with_line_items,
            backorder_counts,
            total_backorder_counts,
            last_uploads;
        `;
        
        // Execute the SQL query
        const { data, error } = await supabase
          .rpc('execute_sql', { sql: sqlQuery });
        
        if (error) {
          console.error('Error fetching Harley Davidson stats:', error);
          toast.error('Failed to load Harley Davidson statistics');
          setIsLoadingStats(false);
          return;
        }
        
        console.log('Received HD stats:', data);
        
        // Extract the data from the result
        if (data && data.length > 0) {
          const statsData = data[0];
          
          if (statsData && typeof statsData === 'object') {
            const statsObj = statsData as Record<string, any>;
            
            // Update stats with data from database
            setStats({
              totalOrders: Number(statsObj.total_orders) || 0,
              ordersWithoutLineItems: Number(statsObj.orders_without_line_items) || 0,
              backorderItems: Number(statsObj.backorder_items) || 0,
              totalBackorderItems: Number(statsObj.total_backorder_items) || 0,
              lastOpenOrdersUpload: statsObj.last_open_orders || null,
              lastLineItemsUpload: statsObj.last_line_items || null,
              lastBackordersUpload: statsObj.last_backorders || null
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
        
        // Fix: Use a direct query instead of rpc to avoid type mismatch issues
        const { data, error } = await supabase
          .from('hd_upload_history')
          .select('id, upload_type, filename, upload_date, items_count, status')
          .order('upload_date', { ascending: false })
          .limit(5);
        
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
