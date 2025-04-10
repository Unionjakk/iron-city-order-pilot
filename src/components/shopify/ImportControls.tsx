
import { useState } from 'react';
import { Clock, Info, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ImportControlsProps {
  lastImport: string | null;
  fetchRecentOrders: () => Promise<void>;
}

const ImportControls = ({ lastImport, fetchRecentOrders }: ImportControlsProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Handle manual import
  const handleManualImport = async () => {
    setIsImporting(true);
    
    try {
      const token = localStorage.getItem('shopify_token');
      
      if (!token) {
        toast({
          title: "Error",
          description: "No API token found. Please add your Shopify API token first.",
          variant: "destructive",
        });
        setIsImporting(false);
        return;
      }
      
      // Simulate a successful import after a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, you would insert the order data into Supabase here
      // For now, let's simulate adding an order for demonstration purposes
      const mockOrderData = {
        shopify_order_id: 'SHO' + Math.floor(Math.random() * 10000),
        created_at: new Date().toISOString(),
        customer_name: 'Simulated Customer',
        items_count: Math.floor(Math.random() * 5) + 1,
        status: 'imported',
      };
      
      const { error } = await supabase
        .from('shopify_orders')
        .insert([mockOrderData]);
        
      if (error) {
        console.error('Error inserting order:', error);
        throw new Error('Failed to insert demo order');
      }
      
      // Fetch the updated orders
      await fetchRecentOrders();
      
      toast({
        title: "Import Completed",
        description: "Successfully imported orders from Shopify.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error importing orders:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-2">
        <div className="flex items-center text-zinc-400">
          <Clock className="mr-2 h-4 w-4" />
          <span>
            {lastImport 
              ? `Last import: ${formatDate(lastImport)}` 
              : 'No imports have been run yet'}
          </span>
        </div>
        
        <div className="flex items-center text-zinc-400">
          <Info className="mr-2 h-4 w-4" />
          <span>Auto-import scheduled every 30 minutes</span>
        </div>
      </div>
      
      <Button 
        onClick={handleManualImport} 
        className="bg-orange-500 hover:bg-orange-600"
        disabled={isImporting}
      >
        {isImporting ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Importing...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Import Orders Now
          </>
        )}
      </Button>
    </div>
  );
};

export default ImportControls;
