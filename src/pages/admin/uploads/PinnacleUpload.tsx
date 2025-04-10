
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const PinnacleUpload = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-800">Pinnacle Upload</h1>
        <p className="text-orange-600">Import inventory data from Pinnacle system</p>
      </div>
      
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-700">Coming Soon: Pinnacle Data Import</CardTitle>
          <CardDescription>Automated inventory synchronization</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This module will allow you to:</p>
          
          <ul className="list-disc pl-5 space-y-2">
            <li>Upload Pinnacle inventory export files in multiple formats</li>
            <li>Schedule automatic imports on a recurring basis</li>
            <li>Define field mappings and data transformations</li>
            <li>View historical import logs and validation reports</li>
            <li>Handle inventory level discrepancies with intelligent reconciliation</li>
          </ul>
          
          <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h3 className="font-medium text-orange-700 mb-2">Development In Progress</h3>
            <p className="text-sm">We're currently building this feature to ensure seamless integration with your existing Pinnacle system. The completed module will provide real-time inventory synchronization for accurate order processing.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PinnacleUpload;
