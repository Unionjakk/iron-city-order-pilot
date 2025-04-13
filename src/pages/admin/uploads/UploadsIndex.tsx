
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const UploadsIndex = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">Data Uploads</h1>
        <p className="text-orange-400/80">Manage data imports from various sources</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-orange-500">Pinnacle Upload</CardTitle>
            <CardDescription className="text-zinc-400">Import inventory data from Pinnacle system</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-zinc-300">Coming soon: Upload and process Pinnacle system inventory data for stock availability checks.</p>
            <Link to="/admin/uploads/pinnacle" className="inline-flex items-center text-orange-500 hover:text-orange-400">
              Go to Pinnacle Upload <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
        
        <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-orange-500">Harley Davidson Upload</CardTitle>
            <CardDescription className="text-zinc-400">Import data from Harley Davidson reports</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-zinc-300">Upload and process Harley Davidson backorders, open orders, and order details.</p>
            <Link to="/admin/uploads/harley/dashboard" className="inline-flex items-center text-orange-500 hover:text-orange-400">
              Go to Harley Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
        
        <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-orange-500">Shopify Integration</CardTitle>
            <CardDescription className="text-zinc-400">Manage Shopify order imports</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-zinc-300">Configure API settings and import orders from your Shopify store.</p>
            <div className="space-y-2">
              <Link to="/admin/uploads/shopify" className="inline-flex items-center text-orange-500 hover:text-orange-400">
                Go to Shopify Integration v2 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <div>
                <Link to="/admin/uploads/shopify/oldAPI" className="inline-flex items-center text-zinc-400 hover:text-zinc-300 text-sm">
                  Go to Legacy Shopify API <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadsIndex;
