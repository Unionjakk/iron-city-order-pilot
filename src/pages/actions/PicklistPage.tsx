
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PicklistPage = () => {
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-orange-500">To Pick</h1>
        <p className="text-orange-400/80">Manage your picking list</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Picklist Dashboard</CardTitle>
          <CardDescription>Coming soon</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This feature is currently under development and will be available soon.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PicklistPage;
