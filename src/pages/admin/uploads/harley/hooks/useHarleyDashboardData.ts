
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
        
        // Fetch total orders count
        const { data: totalOrdersData, error: totalOrdersError } = await supabase
          .from('hd_orders')
          .select('id', { count: 'exact', head: true });
        
        if (totalOrdersError) {
          throw totalOrdersError;
        }
        
        const totalOrders = totalOrdersData?.count || 0;
        
        // Fetch orders with line items count
        const { data: ordersWithLineItemsData, error: ordersWithLineItemsError } = await supabase
          .from('hd_orders')
          .select('id', { count: 'exact', head: true })
          .eq('has_line_items', true);
        
        if (ordersWithLineItemsError) {
          throw ordersWithLineItemsError;
        }
        
        const ordersWithLineItems = ordersWithLineItemsData?.count || 0;
        const ordersWithoutLineItems = totalOrders - ordersWithLineItems;
        
        // Fetch backorder items count
        const { data: backorderItemsData, error: backorderItemsError } = await supabase
          .from('hd_order_line_items')
          .select('id', { count: 'exact', head: true })
          .eq('is_backorder', true);
        
        if (backorderItemsError) {
          throw backorderItemsError;
        }
        
        const backorderItems = backorderItemsData?.count || 0;
        
        // Fetch total backorder items count
        const { data: totalBackorderItemsData, error: totalBackorderItemsError } = await supabase
          .from('hd_backorders')
          .select('id', { count: 'exact', head: true });
        
        if (totalBackorderItemsError) {
          throw totalBackorderItemsError;
        }
        
        const totalBackorderItems = totalBackorderItemsData?.count || 0;
        
        // Fetch last upload dates
        const { data: lastUploadsData, error: lastUploadsError } = await supabase
          .from('hd_upload_history')
          .select('upload_type, upload_date')
          .eq('status', 'success')
          .in('upload_type', ['open_orders', 'order_lines', 'backorders'])
          .order('upload_date', { ascending: false });
        
        if (lastUploadsError) {
          throw lastUploadsError;
        }
        
        // Find the most recent upload date for each type
        let lastOpenOrdersUpload: string | null = null;
        let lastLineItemsUpload: string | null = null;
        let lastBackordersUpload: string | null = null;
        
        if (lastUploadsData && lastUploadsData.length > 0) {
          for (const upload of lastUploadsData) {
            if (upload.upload_type === 'open_orders' && !lastOpenOrdersUpload) {
              lastOpenOrdersUpload = upload.upload_date;
            } else if (upload.upload_type === 'order_lines' && !lastLineItemsUpload) {
              lastLineItemsUpload = upload.upload_date;
            } else if (upload.upload_type === 'backorders' && !lastBackordersUpload) {
              lastBackordersUpload = upload.upload_date;
            }
            
            // Break the loop if we found all types
            if (lastOpenOrdersUpload && lastLineItemsUpload && lastBackordersUpload) {
              break;
            }
          }
        }
        
        // Update stats with data from database
        setStats({
          totalOrders,
          ordersWithoutLineItems,
          backorderItems,
          totalBackorderItems,
          lastOpenOrdersUpload,
          lastLineItemsUpload,
          lastBackordersUpload
        });
        
        console.log('Harley Davidson stats loaded successfully');
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
