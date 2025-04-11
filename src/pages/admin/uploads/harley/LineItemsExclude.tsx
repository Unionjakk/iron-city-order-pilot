
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Plus, Trash2, Info } from 'lucide-react';
import ExcludeOrderForm from './components/ExcludeOrderForm';
import ExcludeOrderList from './components/ExcludeOrderList';
import { toast } from 'sonner';

export type ExcludeReason = 'Check In' | 'Not Shopify';
export type ExcludedOrder = {
  id: string;
  hd_order_number: string;
  reason: ExcludeReason;
  created_at: string;
};

const LineItemsExclude = () => {
  const [excludedOrders, setExcludedOrders] = useState<ExcludedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExcludedOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('hd_lineitems_exclude')
        .select('*')
        .order('created_at', { ascending: false }) as { data: ExcludedOrder[] | null, error: any };

      if (error) {
        throw error;
      }

      setExcludedOrders(data || []);
    } catch (error) {
      console.error('Error fetching excluded orders:', error);
      toast.error('Failed to load excluded orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExcludedOrders();
  }, []);

  const handleAddExclusion = async (orderNumber: string, reason: ExcludeReason) => {
    try {
      // Check if order number already exists
      const { data: existingOrders, error: checkError } = await supabase
        .from('hd_lineitems_exclude')
        .select('id')
        .eq('hd_order_number', orderNumber) as { data: any[] | null, error: any };

      if (checkError) {
        throw checkError;
      }

      if (existingOrders && existingOrders.length > 0) {
        toast.error('This order number is already excluded');
        return;
      }

      const { error } = await supabase
        .from('hd_lineitems_exclude')
        .insert({ hd_order_number: orderNumber, reason }) as { error: any };

      if (error) {
        throw error;
      }

      toast.success('Order excluded successfully');
      fetchExcludedOrders();
    } catch (error) {
      console.error('Error adding exclusion:', error);
      toast.error('Failed to exclude order');
    }
  };

  const handleRemoveExclusion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('hd_lineitems_exclude')
        .delete()
        .eq('id', id) as { error: any };

      if (error) {
        throw error;
      }

      toast.success('Exclusion removed successfully');
      fetchExcludedOrders();
    } catch (error) {
      console.error('Error removing exclusion:', error);
      toast.error('Failed to remove exclusion');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">Line Items Exclusions</h1>
        <p className="text-orange-400/80">Manage order numbers to exclude from line item processing</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Add New Exclusion */}
        <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-500">
              <Plus className="mr-2 h-5 w-5" />
              Add Exclusion
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Exclude an order number from line item processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExcludeOrderForm onAddExclusion={handleAddExclusion} />
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-500">
              <Info className="mr-2 h-5 w-5" />
              About Exclusions
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Why exclude order numbers?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-zinc-300">
              <p>
                Exclusions prevent specific HD orders from being processed during line items imports.
                This is useful for:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <span className="font-semibold text-orange-400">Check In:</span> Orders that need 
                  physical verification before processing
                </li>
                <li>
                  <span className="font-semibold text-orange-400">Not Shopify:</span> Orders that 
                  shouldn't be linked to Shopify orders
                </li>
              </ul>
              <p>
                Excluded orders will be skipped during line items processing, 
                and will not appear in picklists or backorder reports.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exclusion List */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-500">
            <X className="mr-2 h-5 w-5" />
            Excluded Orders
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Currently excluded order numbers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExcludeOrderList 
            excludedOrders={excludedOrders} 
            isLoading={isLoading} 
            onRemoveExclusion={handleRemoveExclusion} 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default LineItemsExclude;
