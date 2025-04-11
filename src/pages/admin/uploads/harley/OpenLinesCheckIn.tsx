
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Clock } from 'lucide-react';

const OpenLinesCheckIn = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">Open Lines Check In</h1>
        <p className="text-orange-400/80">Check in and exclude line items</p>
      </div>
      
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-500">
            <Clock className="mr-2 h-5 w-5" />
            Coming Soon
          </CardTitle>
          <CardDescription className="text-zinc-400">
            This feature is currently under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-4 p-4 bg-zinc-800/50 rounded-md">
            <AlertCircle className="h-8 w-8 text-orange-400 mt-1 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-zinc-200">Open Lines Check In Feature</h3>
              <p className="text-zinc-300">
                This feature will allow you to check in and exclude specific line items from processing, 
                similar to the Open Order Check In functionality but at the line item level.
              </p>
              <p className="text-zinc-400 text-sm">
                Check back soon for this functionality. When implemented, you'll be able to:
              </p>
              <ul className="list-disc pl-6 text-zinc-400 text-sm">
                <li>Select specific line items to check in</li>
                <li>Exclude line items from being processed</li>
                <li>Manage line item exceptions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OpenLinesCheckIn;
