
import { Loader } from 'lucide-react';
import { formatDate } from '@/components/shopify/utils/dateUtils';

type HarleyStatsProps = {
  stats: {
    totalOrders: number;
    ordersWithoutLineItems: number;
    backorderItems: number;
    lastOpenOrdersUpload: string | null;
    lastLineItemsUpload: string | null;
    lastBackordersUpload: string | null;
  };
  isLoading: boolean;
};

const HarleyStatsCard = ({ stats, isLoading }: HarleyStatsProps) => {
  // Format the upload dates for better display if available
  const formatUploadDate = (date: string | null) => date ? formatDate(date) : 'None';
  
  const lastOpenOrdersDate = formatUploadDate(stats.lastOpenOrdersUpload);
  const lastLineItemsDate = formatUploadDate(stats.lastLineItemsUpload);
  const lastBackordersDate = formatUploadDate(stats.lastBackordersUpload);
  
  console.log('HarleyStatsCard rendering with:', { stats, isLoading });
  
  return (
    <div className="p-4 bg-zinc-800/60 rounded-lg border border-zinc-700">
      <h3 className="font-medium text-orange-400 mb-3">Current Data Status</h3>
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader className="h-6 w-6 animate-spin text-orange-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div>
              <span className="text-zinc-400 text-sm">Total Open Orders:</span>
              <span className="ml-2 text-zinc-200 font-semibold">
                {stats.totalOrders > 0 ? stats.totalOrders.toLocaleString() : 'None'}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 text-sm">Orders Without Line Items:</span>
              <span className="ml-2 text-zinc-200 font-semibold">
                {stats.ordersWithoutLineItems > 0 ? stats.ordersWithoutLineItems.toLocaleString() : 'None'}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 text-sm">Items on Backorder:</span>
              <span className="ml-2 text-zinc-200 font-semibold">
                {stats.backorderItems > 0 ? stats.backorderItems.toLocaleString() : 'None'}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div>
              <span className="text-zinc-400 text-sm">Last Open Orders Upload:</span>
              <span className="ml-2 text-zinc-200 font-semibold">{lastOpenOrdersDate}</span>
            </div>
            <div>
              <span className="text-zinc-400 text-sm">Last Line Items Upload:</span>
              <span className="ml-2 text-zinc-200 font-semibold">{lastLineItemsDate}</span>
            </div>
            <div>
              <span className="text-zinc-400 text-sm">Last Backorders Upload:</span>
              <span className="ml-2 text-zinc-200 font-semibold">{lastBackordersDate}</span>
            </div>
          </div>
          
          <div className="bg-zinc-700/40 rounded p-3">
            <h4 className="text-sm font-medium text-orange-400 mb-2">Upload Status</h4>
            {stats.totalOrders > 0 ? (
              <div className="space-y-2 text-xs text-zinc-300">
                <div className="flex justify-between items-center">
                  <span>Orders with line items:</span>
                  <span className="font-medium">
                    {Math.round(((stats.totalOrders - stats.ordersWithoutLineItems) / stats.totalOrders) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5">
                  <div 
                    className="bg-orange-500 h-1.5 rounded-full" 
                    style={{ width: `${Math.round(((stats.totalOrders - stats.ordersWithoutLineItems) / stats.totalOrders) * 100)}%` }}>
                  </div>
                </div>
                {stats.backorderItems > 0 && (
                  <p className="mt-2 text-amber-400">
                    {stats.backorderItems} items currently on backorder
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-300">
                No data has been uploaded yet. Begin by uploading the Open Orders List from H-D NET.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HarleyStatsCard;
