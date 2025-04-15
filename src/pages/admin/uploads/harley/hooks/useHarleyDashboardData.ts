
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
        console.log("Fetching Harley Davidson statistics from improved view...");
        
        // Fetch stats from the enhanced database view
        const { data: viewData, error: viewError } = await supabase
          .from('hd_dashboard_stats')
          .select('*')
          .single();
        
        if (viewError) {
          console.error('Error fetching stats from view:', viewError);
          throw viewError;
        }
        
        if (viewData) {
          console.log('Raw view data:', viewData);
          // Update stats with data from the new, more accurate view
          // which now accounts for excluded orders in the orders_without_line_items count
          setStats({
            totalOrders: viewData.total_orders || 0,
            ordersWithoutLineItems: viewData.orders_without_line_items || 0,
            backorderItems: viewData.backorder_items || 0,
            totalBackorderItems: viewData.total_backorder_items || 0,
            lastOpenOrdersUpload: viewData.last_open_orders_upload,
            lastLineItemsUpload: viewData.last_line_items_upload,
            lastBackordersUpload: viewData.last_backorders_upload
          });
        }
        
        console.log('Harley Davidson stats loaded successfully using improved view');
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
        
        // Fetch recent uploads
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
