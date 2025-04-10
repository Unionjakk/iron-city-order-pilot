
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const HarleyUpload = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-800">Harley Davidson Upload</h1>
        <p className="text-orange-600">Import data from Harley Davidson reports</p>
      </div>
      
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-700">Coming Soon: Harley Davidson Data Import</CardTitle>
          <CardDescription>Comprehensive report processing</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This module will enable you to:</p>
          
          <ul className="list-disc pl-5 space-y-2">
            <li>Upload and process multiple Harley Davidson report types:
              <ul className="list-disc pl-5 mt-1">
                <li>Backorder reports</li>
                <li>Open order status reports</li>
                <li>Detailed order information</li>
                <li>Product catalogs and pricing updates</li>
              </ul>
            </li>
            <li>Track changes and updates across different report versions</li>
            <li>Receive alerts for critical status changes or delays</li>
            <li>Generate actionable insights from historical ordering patterns</li>
          </ul>
          
          <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h3 className="font-medium text-orange-700 mb-2">Development In Progress</h3>
            <p className="text-sm">We're currently building this feature to handle the complexities of Harley Davidson's reporting systems. The completed module will provide comprehensive visibility into your orders, backorders, and product availability.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HarleyUpload;
