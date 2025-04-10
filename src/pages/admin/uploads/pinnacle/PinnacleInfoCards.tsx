
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

const PinnacleSettingsCard = () => {
  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-orange-500">Pinnacle Settings</CardTitle>
        <CardDescription className="text-zinc-400">Reference for generating the correct export file</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center mb-4">
          <img 
            src="/lovable-uploads/a5bbc25d-4af3-4a7d-89c6-ecb810d397ea.png" 
            alt="Pinnacle Export Settings" 
            className="max-w-full h-auto rounded-lg border border-zinc-700 shadow-md" 
          />
        </div>
        
        <div className="mt-6 p-4 bg-zinc-800/60 rounded-lg border border-zinc-700">
          <h3 className="font-medium text-orange-400 mb-2 flex items-center gap-2">
            <Info className="h-5 w-5" /> 
            How to Generate Pinnacle Export
          </h3>
          <ol className="list-decimal pl-5 space-y-2 text-zinc-300">
            <li>Log in to Pinnacle system</li>
            <li>Navigate to the "Valuation Report" section</li>
            <li>Select "Parts" as the report type</li>
            <li>Do not filter by Product Group (leave as "Please Select...")</li>
            <li>Ensure all columns are visible (Part No, Prod Group, Description, Bin Locations, Stock Holding, and all cost/retail columns)</li>
            <li>Generate the report</li>
            <li>Export to Excel format</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

const PinnacleNotesCard = () => {
  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-orange-500">Important Notes</CardTitle>
        <CardDescription className="text-zinc-400">About inventory synchronization</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-medium text-zinc-300">Automatic Replacement</h3>
              <p className="text-sm text-zinc-400">Each upload will completely replace the existing stock data. This ensures you always have the most up-to-date inventory information.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-medium text-zinc-300">Data Validation</h3>
              <p className="text-sm text-zinc-400">The system validates the file format and required columns before processing. This helps prevent errors in your inventory data.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-medium text-zinc-300">Regular Updates</h3>
              <p className="text-sm text-zinc-400">For accurate order processing, it's recommended to upload fresh inventory data at least daily, or whenever significant inventory changes occur.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { PinnacleSettingsCard, PinnacleNotesCard };
