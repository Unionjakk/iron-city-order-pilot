
import { Link } from 'react-router-dom';
import { ArrowRight, FileSpreadsheet, FileText, Truck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const HarleyUploadTiles = () => {
  return (
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
  );
};

export default HarleyUploadTiles;
