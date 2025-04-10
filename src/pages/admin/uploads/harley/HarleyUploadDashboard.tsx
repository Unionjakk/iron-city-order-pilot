
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { ArrowRight, FileSpreadsheet, UploadCloud, AlertTriangle, FileText, Truck, Loader, Clock } from 'lucide-react';
import { formatDate } from '@/components/shopify/utils/dateUtils';
import HarleyStatsCard from './components/HarleyStatsCard';
import { toast } from 'sonner';

const HarleyUploadDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    ordersWithoutLineItems: 0,
    backorderItems: 0,
    lastOpenOrdersUpload: null,
    lastLineItemsUpload: null,
    lastBackordersUpload: null
  });
  
  // Fetch Harley Davidson import statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching Harley Davidson statistics...");
        
        const { data, error } = await supabase.rpc('get_hd_stats');
        
        if (error) {
          console.error('Error fetching Harley Davidson stats:', error);
          toast.error('Failed to load Harley Davidson statistics');
          setIsLoading(false);
          return;
        }
        
        console.log('Received HD stats:', data);
        
        // Update stats with data from database
        setStats({
          totalOrders: data.totalOrders || 0,
          ordersWithoutLineItems: data.ordersWithoutLineItems || 0,
          backorderItems: data.backorderItems || 0,
          lastOpenOrdersUpload: data.lastOpenOrdersUpload,
          lastLineItemsUpload: data.lastLineItemsUpload,
          lastBackordersUpload: data.lastBackordersUpload
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching Harley Davidson stats:', error);
        toast.error('Failed to load Harley Davidson statistics');
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  // Get recent uploads for the activity log
  const [recentUploads, setRecentUploads] = useState([]);
  const [isLoadingUploads, setIsLoadingUploads] = useState(true);
  
  useEffect(() => {
    const fetchRecentUploads = async () => {
      try {
        setIsLoadingUploads(true);
        
        const { data, error } = await supabase
          .from('hd_upload_history')
          .select('*')
          .order('upload_date', { ascending: false })
          .limit(5);
        
        if (error) {
          console.error('Error fetching recent uploads:', error);
          setIsLoadingUploads(false);
          return;
        }
        
        console.log('Recent uploads:', data);
        setRecentUploads(data || []);
        setIsLoadingUploads(false);
      } catch (error) {
        console.error('Error fetching recent uploads:', error);
        setIsLoadingUploads(false);
      }
    };
    
    fetchRecentUploads();
  }, []);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">Harley Davidson Import Dashboard</h1>
        <p className="text-orange-400/80">Upload and manage Harley Davidson order data</p>
      </div>
      
      {/* Stats Card */}
      <HarleyStatsCard stats={stats} isLoading={isLoading} />
      
      {/* Upload Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Open Orders Upload */}
        <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-500">
              <FileSpreadsheet className="mr-2 h-5 w-5" />
              Open Orders Upload
            </CardTitle>
            <CardDescription className="text-zinc-400">Import order information from H-D NET</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-zinc-300">
              Upload Open Orders list exports from H-D NET to initialize order tracking.
            </p>
            <Link to="/admin/uploads/harley/open-orders" className="inline-flex items-center text-orange-500 hover:text-orange-400">
              Go to Open Orders Upload <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
        
        {/* Order Line Items Upload */}
        <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-500">
              <FileText className="mr-2 h-5 w-5" />
              Order Line Items Upload
            </CardTitle>
            <CardDescription className="text-zinc-400">Import detailed part information</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-zinc-300">
              Upload Order Line Items exports to add detailed part information to orders.
            </p>
            <Link to="/admin/uploads/harley/order-lines" className="inline-flex items-center text-orange-500 hover:text-orange-400">
              Go to Line Items Upload <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
        
        {/* Backorder Report Upload */}
        <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-500">
              <Truck className="mr-2 h-5 w-5" />
              Backorder Report Upload
            </CardTitle>
            <CardDescription className="text-zinc-400">Update backorder status information</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-zinc-300">
              Upload Backorder Reports to update status and projected shipping dates.
            </p>
            <Link to="/admin/uploads/harley/backorders" className="inline-flex items-center text-orange-500 hover:text-orange-400">
              Go to Backorder Upload <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
      
      {/* Processing Instructions */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-500">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Upload Instructions
          </CardTitle>
          <CardDescription className="text-zinc-400">How to use the Harley Davidson import system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-orange-400">Recommended Workflow:</h3>
            <ol className="list-decimal list-inside space-y-2 text-zinc-300">
              <li>Start with uploading the <span className="text-orange-400 font-medium">Open Orders List</span> to identify all current orders</li>
              <li>Next, upload <span className="text-orange-400 font-medium">Order Line Items</span> for each order (either individually or in batch)</li>
              <li>Finally, upload the <span className="text-orange-400 font-medium">Backorder Report</span> to update backorder status</li>
              <li>Check the dashboard for any orders missing line items or other issues</li>
              <li>Repeat this process daily to keep data current</li>
            </ol>
            
            <div className="mt-6 p-4 bg-zinc-800/60 rounded-lg border border-zinc-700">
              <h3 className="font-medium text-orange-400 mb-2">Note:</h3>
              <p className="text-sm text-zinc-300">
                All files should be exported directly from H-D NET in Excel (.xls) format. Each upload interface provides specific instructions for downloading the correct reports.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Activity Log */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-500">
            <Clock className="mr-2 h-5 w-5" />
            Recent Activity Log
          </CardTitle>
          <CardDescription className="text-zinc-400">Recent upload activity</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUploads ? (
            <div className="flex justify-center py-6">
              <Loader className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : recentUploads.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-700">
                      <th className="text-left py-2 px-2 text-zinc-400">Type</th>
                      <th className="text-left py-2 px-2 text-zinc-400">Filename</th>
                      <th className="text-left py-2 px-2 text-zinc-400">Date</th>
                      <th className="text-left py-2 px-2 text-zinc-400">Items</th>
                      <th className="text-left py-2 px-2 text-zinc-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUploads.map((upload: any) => (
                      <tr key={upload.id} className="border-b border-zinc-800 hover:bg-zinc-800/30">
                        <td className="py-2 px-2">
                          <span className="capitalize">{upload.upload_type?.replace('_', ' ')}</span>
                        </td>
                        <td className="py-2 px-2 text-xs text-zinc-400">{upload.filename}</td>
                        <td className="py-2 px-2">{formatDate(upload.upload_date)}</td>
                        <td className="py-2 px-2">{upload.items_count}</td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            upload.status === 'success' 
                              ? 'bg-green-900/30 text-green-400' 
                              : upload.status === 'partial_success'
                                ? 'bg-yellow-900/30 text-yellow-400'
                                : 'bg-red-900/30 text-red-400'
                          }`}>
                            {upload.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-zinc-400">
                Recent upload activity will be displayed here once data imports begin.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HarleyUploadDashboard;
