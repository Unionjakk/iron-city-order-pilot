
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, FileText, FileSpreadsheet, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

const HarleyUpload = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">Harley Davidson Upload</h1>
        <p className="text-orange-400/80">Import and manage Harley Davidson data</p>
      </div>
      
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-orange-500">Harley Davidson Upload Options</CardTitle>
          <CardDescription className="text-zinc-400">Choose an upload type or go to the dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-zinc-300">The Harley Davidson Import Module allows you to upload and manage data from H-D NET.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Link 
              to="/admin/uploads/harley/dashboard" 
              className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-colors"
            >
              <span className="text-orange-400 font-medium">Go to Dashboard</span>
              <ArrowRight className="h-4 w-4 text-orange-400" />
            </Link>
            <Link 
              to="/admin/uploads/harley/open-orders" 
              className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-colors"
            >
              <div className="flex items-center">
                <FileText className="h-4 w-4 text-orange-400 mr-2" />
                <span className="text-orange-400 font-medium">Upload Open Orders</span>
              </div>
              <ArrowRight className="h-4 w-4 text-orange-400" />
            </Link>
            <Link 
              to="/admin/uploads/harley/order-lines" 
              className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-colors"
            >
              <div className="flex items-center">
                <FileSpreadsheet className="h-4 w-4 text-orange-400 mr-2" />
                <span className="text-orange-400 font-medium">Upload Order Line Items</span>
              </div>
              <ArrowRight className="h-4 w-4 text-orange-400" />
            </Link>
            <Link 
              to="/admin/uploads/harley/backorders" 
              className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-colors"
            >
              <div className="flex items-center">
                <Package className="h-4 w-4 text-orange-400 mr-2" />
                <span className="text-orange-400 font-medium">Upload Backorders</span>
              </div>
              <ArrowRight className="h-4 w-4 text-orange-400" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HarleyUpload;
