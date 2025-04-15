
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

const PicklistPage = () => {
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="page-title">To Pick</h1>
        <p className="page-description">Manage your picking list for Leeds Iron City Motorcycles</p>
      </div>
      
      <Card className="card-styled">
        <CardHeader className="bg-zinc-800/50 rounded-t-lg border-b border-zinc-700/50">
          <CardTitle className="text-orange-500">Picklist Dashboard</CardTitle>
          <CardDescription className="text-zinc-400">
            New version coming soon
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="p-10 text-center">
            <Package className="mx-auto h-24 w-24 text-orange-500/50" />
            <h3 className="mt-6 text-2xl font-semibold text-orange-500">Coming Soon</h3>
            <p className="mt-4 text-zinc-400 max-w-md mx-auto">
              We're working on an improved version of the picklist dashboard.
              The new features will be available soon.
            </p>
            <p className="mt-6 text-zinc-500 text-sm">
              <a href="/actions/oldpicklist" className="text-orange-400 hover:underline">
                Access the previous version here
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PicklistPage;
