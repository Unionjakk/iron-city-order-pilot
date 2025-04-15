
import { LayoutDashboard, Trash2, Download, MapPin, List, Link } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProgressCard from '@/components/dashboard/ProgressCard';

const ShopifyDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">Leeds Harley Shopify Integration</h1>
        <p className="text-orange-400/80">Configure and manage Shopify order imports</p>
      </div>

      {/* Production Warning */}
      <Alert className="bg-zinc-800/60 border-amber-500/50">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <AlertTitle className="text-amber-500">Production System</AlertTitle>
        <AlertDescription className="text-zinc-300">
          This is a real production system connected to the live Shopify store. All actions here will affect the actual store data.
        </AlertDescription>
      </Alert>

      {/* API Configuration Card */}
      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader>
          <CardTitle className="text-orange-500">Shopify API Configuration</CardTitle>
          <CardDescription>
            Securely connect to your Shopify store
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RouterLink to="/admin/uploads/shopify/v2">
            <Button className="w-full md:w-auto bg-orange-500 hover:bg-orange-600">
              Configure API & All Functions
            </Button>
          </RouterLink>
        </CardContent>
      </Card>

      {/* Progress Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <ProgressCard
          icon={Trash2}
          title="Delete All Orders"
          description="Delete all imported Shopify orders and order lines"
          to="/admin/uploads/shopify/deleteall"
        />
        
        <ProgressCard
          icon={Download}
          title="Import All Open Orders V2"
          description="Import open orders with V2 implementation"
          to="/admin/uploads/shopify/importall"
        />
        
        <ProgressCard
          icon={MapPin}
          title="Batch Location Update V3 (GraphQL)"
          description="Update locations using the new GraphQL implementation"
          to="/admin/uploads/shopify/batchlocation"
        />
        
        <ProgressCard
          icon={List}
          title="Generate Pick List"
          description="Generate pick lists from imported orders"
          to="/admin/uploads/shopify/picklist"
        />
      </div>

      {/* Discrete V2 Page Link */}
      <div className="text-center mt-6">
        <RouterLink 
          to="/admin/uploads/shopify/v2" 
          className="text-zinc-400 hover:text-orange-500 text-sm inline-flex items-center gap-2"
        >
          <Link className="h-4 w-4" /> 
          Advanced Shopify API Settings
        </RouterLink>
      </div>
    </div>
  );
};

export default ShopifyDashboard;
