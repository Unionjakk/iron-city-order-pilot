
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePinnacleLastUpload } from "@/hooks/usePinnacleLastUpload";
import { Loader } from "lucide-react";

const PicklistPage = () => {
  const { lastUpload, isLoading } = usePinnacleLastUpload();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">Generate Pick List</h1>
        <p className="text-orange-400/80">Generate pick lists from imported orders</p>
      </div>
      
      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader>
          <CardTitle className="text-orange-500">Pick List Generation</CardTitle>
          <CardDescription className="text-zinc-400">
            Coming soon: Generate and manage pick lists from your Shopify orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-zinc-400">
              This feature is currently under development and will be available soon.
            </p>
            
            <div className="border-t border-zinc-800 pt-4">
              <div className="flex items-center space-x-2">
                <span className="text-zinc-400">Last Pinnacle Upload:</span>
                {isLoading ? (
                  <Loader className="h-4 w-4 animate-spin text-orange-500" />
                ) : (
                  <span className="text-orange-500">
                    {lastUpload || 'No uploads found'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PicklistPage;
