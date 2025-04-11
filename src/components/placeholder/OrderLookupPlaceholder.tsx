
import { Search, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const OrderLookupPlaceholder = () => {
  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-orange-500">Order Lookup</h1>
        <p className="text-orange-400/80 mt-2">Search for and view detailed order information</p>
      </div>

      <Alert className="bg-amber-900/20 border-amber-500/50">
        <AlertCircle className="h-5 w-5 text-amber-500" />
        <AlertTitle className="text-amber-400">Coming Soon</AlertTitle>
        <AlertDescription className="text-zinc-300">
          The Order Lookup tool is currently under development and will be available soon.
          This feature will allow you to search for orders by order number, customer email, or customer name.
        </AlertDescription>
      </Alert>

      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-zinc-200 flex items-center">
            <Search className="mr-2 h-5 w-5 text-orange-500" /> 
            Feature Preview
          </CardTitle>
          <CardDescription className="text-zinc-400">
            When completed, the Order Lookup tool will include these features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border border-dashed border-zinc-700 rounded-lg p-6 bg-zinc-800/30">
            <div className="flex flex-col space-y-4">
              <div className="space-y-2">
                <div className="h-4 w-32 bg-zinc-700 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-zinc-700 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-40 bg-zinc-700 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-zinc-700 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-36 bg-zinc-700 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-zinc-700 rounded animate-pulse"></div>
              </div>
              <div className="mt-2">
                <div className="h-10 w-32 bg-orange-500/40 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          
          <div className="border border-dashed border-zinc-700 rounded-lg p-6 bg-zinc-800/30">
            <div className="flex flex-col space-y-6">
              <div className="h-6 w-48 bg-zinc-700 rounded animate-pulse"></div>
              <div className="grid grid-cols-4 gap-4">
                <div className="h-8 bg-zinc-700 rounded animate-pulse"></div>
                <div className="h-8 bg-zinc-700 rounded animate-pulse"></div>
                <div className="h-8 bg-zinc-700 rounded animate-pulse"></div>
                <div className="h-8 bg-zinc-700 rounded animate-pulse"></div>
              </div>
              <div className="space-y-4">
                <div className="h-16 w-full bg-zinc-700 rounded animate-pulse"></div>
                <div className="h-16 w-full bg-zinc-700 rounded animate-pulse"></div>
                <div className="h-16 w-full bg-zinc-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderLookupPlaceholder;
