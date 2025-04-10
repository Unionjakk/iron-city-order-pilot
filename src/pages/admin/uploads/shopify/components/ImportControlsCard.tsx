
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImportControls from '@/components/shopify/ImportControls';

interface ImportControlsCardProps {
  lastImport: string | null;
  fetchRecentOrders: () => Promise<void>;
  ordersLoading: boolean;
  handleRefresh: () => void;
}

const ImportControlsCard = ({ 
  lastImport, 
  fetchRecentOrders, 
  ordersLoading, 
  handleRefresh 
}: ImportControlsCardProps) => {
  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-orange-500 flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" /> Order Import Controls
          </CardTitle>
          <CardDescription className="text-zinc-400">Manage Shopify unfulfilled order imports</CardDescription>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          size="sm"
          disabled={ordersLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${ordersLoading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </CardHeader>
      <CardContent>
        <ImportControls 
          lastImport={lastImport} 
          fetchRecentOrders={fetchRecentOrders} 
        />
      </CardContent>
    </Card>
  );
};

export default ImportControlsCard;
