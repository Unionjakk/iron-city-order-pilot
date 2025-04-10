
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">Admin Dashboard</h1>
        <p className="text-orange-400/80">Manage your system settings and data imports</p>
      </div>
      
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-orange-500">Coming Soon: Admin Controls</CardTitle>
          <CardDescription className="text-zinc-400">Advanced management tools for your order system</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-zinc-300">This administrative dashboard will provide comprehensive management tools for your entire order processing workflow:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-800/60 p-4 rounded-lg border border-zinc-700">
              <h3 className="font-medium text-orange-400 mb-2">Data Import Management</h3>
              <p className="text-sm text-zinc-300">Configure and schedule automatic data imports from all your connected systems.</p>
            </div>
            
            <div className="bg-zinc-800/60 p-4 rounded-lg border border-zinc-700">
              <h3 className="font-medium text-orange-400 mb-2">User Access Control</h3>
              <p className="text-sm text-zinc-300">Manage permissions and create role-based access for your team members.</p>
            </div>
            
            <div className="bg-zinc-800/60 p-4 rounded-lg border border-zinc-700">
              <h3 className="font-medium text-orange-400 mb-2">System Configuration</h3>
              <p className="text-sm text-zinc-300">Customize business rules, notifications, and system behavior to match your workflow.</p>
            </div>
            
            <div className="bg-zinc-800/60 p-4 rounded-lg border border-zinc-700">
              <h3 className="font-medium text-orange-400 mb-2">Reporting & Analytics</h3>
              <p className="text-sm text-zinc-300">Access advanced insights into your order processing and fulfillment metrics.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
