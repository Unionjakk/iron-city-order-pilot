
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PickedPage = () => {
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-orange-500">Picked Orders</h1>
        <p className="text-orange-400/80">View all orders that have been picked</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Picked Orders Dashboard</CardTitle>
          <CardDescription>Coming soon</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This feature is currently under development and will be available soon.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PickedPage;
