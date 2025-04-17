
import { useState, useEffect } from 'react';
import { Database, CircleCheck, CircleX, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DatabaseStat {
  label: string;
  value: string | number;
  loading: boolean;
  error?: string;
}

export const DatabaseStats = () => {
  const [stats, setStats] = useState<DatabaseStat[]>([
    { label: 'Count of Shopify Orders', value: 0, loading: true },
    { label: 'Count of Unfulfilled Orders', value: 0, loading: true },
    { label: 'Count of Partial Orders', value: 0, loading: true },
    { label: 'Count of Shopify Order Lines', value: 0, loading: true },
    { label: 'Check of Location Names', value: 'Checking...', loading: true },
  ]);

  useEffect(() => {
    const fetchDatabaseStats = async () => {
      try {
        // Count all orders
        const { count: totalOrders, error: totalOrdersError } = await supabase
          .from('shopify_orders')
          .select('*', { count: 'exact', head: true });
        
        if (totalOrdersError) throw new Error(`Error counting orders: ${totalOrdersError.message}`);
        
        // Count unfulfilled orders
        const { count: unfulfilledOrders, error: unfulfilledError } = await supabase
          .from('shopify_orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'unfulfilled');
        
        if (unfulfilledError) throw new Error(`Error counting unfulfilled orders: ${unfulfilledError.message}`);
        
        // Count partial orders
        const { count: partialOrders, error: partialError } = await supabase
          .from('shopify_orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'partial');
        
        if (partialError) throw new Error(`Error counting partial orders: ${partialError.message}`);
        
        // Count order items
        const { count: orderItems, error: itemsError } = await supabase
          .from('shopify_order_items')
          .select('*', { count: 'exact', head: true });
        
        if (itemsError) throw new Error(`Error counting order items: ${itemsError.message}`);
        
        // Check if all locations are populated
        const { count: nullLocations, error: locationsError } = await supabase
          .from('shopify_order_items')
          .select('*', { count: 'exact', head: true })
          .is('location_name', null);
        
        if (locationsError) throw new Error(`Error checking locations: ${locationsError.message}`);
        
        const locationCheck = nullLocations === 0 ? true : false;
        
        // Update all stats at once
        setStats([
          { label: 'Count of Shopify Orders', value: totalOrders || 0, loading: false },
          { label: 'Count of Unfulfilled Orders', value: unfulfilledOrders || 0, loading: false },
          { label: 'Count of Partial Orders', value: partialOrders || 0, loading: false },
          { label: 'Count of Shopify Order Lines', value: orderItems || 0, loading: false },
          { label: 'Check of Location Names', value: locationCheck ? 'Complete' : 'Incomplete', loading: false },
        ]);
        
      } catch (error: any) {
        console.error('Error fetching database stats:', error);
        
        // Update stats with error
        setStats(prevStats => 
          prevStats.map(stat => ({
            ...stat,
            loading: false,
            error: error.message
          }))
        );
      }
    };

    fetchDatabaseStats();
  }, []);

  return (
    <div className="mt-4 space-y-3">
      {stats.map((stat, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-300">
            <Database className="h-4 w-4 text-orange-500/70" />
            <span>{stat.label}</span>
          </div>
          
          <div className="font-mono">
            {stat.loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
            ) : stat.error ? (
              <span className="text-red-400 text-sm">{stat.error}</span>
            ) : stat.label === 'Check of Location Names' ? (
              <div className="flex items-center gap-1">
                {stat.value === 'Complete' ? (
                  <CircleCheck className="h-4 w-4 text-green-500" />
                ) : (
                  <CircleX className="h-4 w-4 text-amber-500" />
                )}
                <span className={stat.value === 'Complete' ? 'text-green-500' : 'text-amber-500'}>
                  {stat.value}
                </span>
              </div>
            ) : (
              <span className="text-orange-500">{stat.value}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DatabaseStats;
