
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ActionsIndex = () => {
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-orange-500">Actions</h1>
        <p className="text-orange-400/80">Manage your action items</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Actions Dashboard</CardTitle>
          <CardDescription>Coming soon</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This feature is currently under development and will be available soon.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActionsIndex;
