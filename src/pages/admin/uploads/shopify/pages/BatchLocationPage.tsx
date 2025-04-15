
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import BatchLocationUpdateV3 from "@/components/shopify/BatchLocationUpdateV3";
import BatchLocationUpdateV2 from "@/components/shopify/BatchLocationUpdateV2";

const BatchLocationPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">Batch Location Update V3</h1>
        <p className="text-orange-400/80">Update location information for line items in orders using GraphQL</p>
      </div>
      
      {/* Production Warning */}
      <Alert className="bg-zinc-800/60 border-amber-500/50">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <AlertTitle className="text-amber-500">Production System</AlertTitle>
        <AlertDescription className="text-zinc-300">
          This is a real production system connected to the live Shopify store. All actions here will affect the actual store data.
        </AlertDescription>
      </Alert>
      
      {/* New V3 Implementation */}
      <BatchLocationUpdateV3 />
      
      {/* Existing V2 Implementation */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-orange-500">Previous Implementations</CardTitle>
          <CardDescription className="text-zinc-400">
            Older versions of the batch location update functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BatchLocationUpdateV2 />
        </CardContent>
      </Card>
    </div>
  );
};

export default BatchLocationPage;
