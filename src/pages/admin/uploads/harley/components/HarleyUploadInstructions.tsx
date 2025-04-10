
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const HarleyUploadInstructions = () => {
  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-orange-500">
          <AlertTriangle className="mr-2 h-5 w-5" />
          Upload Instructions
        </CardTitle>
        <CardDescription className="text-zinc-400">How to use the Harley Davidson import system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-orange-400">Recommended Workflow:</h3>
          <ol className="list-decimal list-inside space-y-2 text-zinc-300">
            <li>Start with uploading the <span className="text-orange-400 font-medium">Open Orders List</span> to identify all current orders</li>
            <li>Next, upload <span className="text-orange-400 font-medium">Order Line Items</span> for each order (either individually or in batch)</li>
            <li>Finally, upload the <span className="text-orange-400 font-medium">Backorder Report</span> to update backorder status</li>
            <li>Check the dashboard for any orders missing line items or other issues</li>
            <li>Repeat this process daily to keep data current</li>
          </ol>
          
          <div className="mt-6 p-4 bg-zinc-800/60 rounded-lg border border-zinc-700">
            <h3 className="font-medium text-orange-400 mb-2">Note:</h3>
            <p className="text-sm text-zinc-300">
              All files should be exported directly from H-D NET in Excel (.xls) format. Each upload interface provides specific instructions for downloading the correct reports.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HarleyUploadInstructions;
