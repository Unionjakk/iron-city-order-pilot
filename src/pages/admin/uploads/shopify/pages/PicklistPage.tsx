
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PicklistPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">Generate Pick List</h1>
        <p className="text-orange-400/80">Generate pick lists from imported orders</p>
      </div>
      
      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader>
          <CardTitle className="text-orange-500">Pick List Generation</CardTitle>
          <CardDescription>
            Coming soon: Generate and manage pick lists from your Shopify orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-400">
            This feature is currently under development and will be available soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PicklistPage;
