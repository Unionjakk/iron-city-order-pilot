
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-800">Admin Dashboard</h1>
        <p className="text-orange-600">Manage your system settings and data imports</p>
      </div>
      
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-700">Coming Soon: Admin Controls</CardTitle>
          <CardDescription>Advanced management tools for your order system</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This administrative dashboard will provide comprehensive management tools for your entire order processing workflow:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h3 className="font-medium text-orange-700 mb-2">Data Import Management</h3>
              <p className="text-sm">Configure and schedule automatic data imports from all your connected systems.</p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h3 className="font-medium text-orange-700 mb-2">User Access Control</h3>
              <p className="text-sm">Manage permissions and create role-based access for your team members.</p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h3 className="font-medium text-orange-700 mb-2">System Configuration</h3>
              <p className="text-sm">Customize business rules, notifications, and system behavior to match your workflow.</p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h3 className="font-medium text-orange-700 mb-2">Reporting & Analytics</h3>
              <p className="text-sm">Access advanced insights into your order processing and fulfillment metrics.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
