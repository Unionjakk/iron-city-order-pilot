
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ArrowUpDown } from "lucide-react";
import BatchLocationUpdateV3 from "@/components/shopify/BatchLocationUpdateV3";
import BatchLocationUpdateV2 from "@/components/shopify/BatchLocationUpdateV2";

const BatchLocationPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">GraphQL Batch Location Update (V3 - Debug Mode)</h1>
        <p className="text-orange-400/80">Single batch implementation for debugging with detailed log output</p>
      </div>
      
      {/* Production Warning */}
      <Alert className="bg-zinc-800/60 border-amber-500/50">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <AlertTitle className="text-amber-500">Debug Mode Activated</AlertTitle>
        <AlertDescription className="text-zinc-300">
          This version has been modified to run only a single batch and provides detailed diagnostic information.
          All API responses and database operations will be shown in the tabs below.
        </AlertDescription>
      </Alert>
      
      {/* New V3 Implementation */}
      <Card className="border-orange-800/40 bg-orange-900/10 backdrop-blur-sm">
        <CardHeader className="border-b border-orange-800/20 pb-3">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-orange-500" />
            <CardTitle className="text-orange-500">V3 GraphQL Implementation (Debug Mode)</CardTitle>
          </div>
          <CardDescription className="text-zinc-400">
            Single batch version with detailed logging for diagnosis
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <BatchLocationUpdateV3 />
        </CardContent>
      </Card>
      
      {/* Existing V2 Implementation */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-zinc-500">Previous Implementations</CardTitle>
          <CardDescription className="text-zinc-400">
            Legacy versions (not recommended for regular use)
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
