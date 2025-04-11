
import { Info, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const OrderLinesInstructions = () => {
  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-orange-500">
          <Info className="mr-2 h-5 w-5" />
          Instructions
        </CardTitle>
        <CardDescription className="text-zinc-400">How to download and prepare Order Line Items files</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-orange-400">Downloading Order Line Items from H-D NET:</h3>
          <ol className="list-decimal list-inside space-y-2 text-zinc-300">
            <li>Log in to the H-D NET system</li>
            <li>Navigate to "ORDER INQUIRY"</li>
            <li>Select "ORDER LINE ITEMS" tab</li>
            <li>Enter the HD Order Number in the "Sales Order Number" field</li>
            <li>Click the search icon</li>
            <li>Ensure "Both" is selected under "SHOW" options</li>
            <li>Click the export icon in the top-right section of the order lines grid</li>
            <li>Save the Excel file to your computer</li>
            <li>Repeat for each HD Order Number needing import</li>
          </ol>
          
          <div className="mt-6 p-4 bg-zinc-800/60 rounded-lg border border-zinc-700">
            <h3 className="flex items-center font-medium text-orange-400 mb-2">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Important Notes:
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-zinc-300">
              <li>You can upload multiple Order Line Items files at once</li>
              <li>Each file should contain data for a single HD Order Number</li>
              <li>Do not modify the exported files before uploading</li>
              <li>Uploading line items for an HD Order will replace any existing line items for that order</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderLinesInstructions;
