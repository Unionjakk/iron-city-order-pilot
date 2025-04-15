
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import BatchLocationUpdateV2 from "@/components/shopify/BatchLocationUpdateV2";

const BatchLocationPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">Batch Location Update V2</h1>
        <p className="text-orange-400/80">Update location information using V2 implementation</p>
      </div>
      
      {/* Production Warning */}
      <Alert className="bg-zinc-800/60 border-amber-500/50">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <AlertTitle className="text-amber-500">Production System</AlertTitle>
        <AlertDescription className="text-zinc-300">
          This is a real production system connected to the live Shopify store. All actions here will affect the actual store data.
        </AlertDescription>
      </Alert>
      
      <BatchLocationUpdateV2 />
    </div>
  );
};

export default BatchLocationPage;
