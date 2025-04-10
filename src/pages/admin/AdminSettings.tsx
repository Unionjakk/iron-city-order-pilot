
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

const AdminSettings = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6 text-orange-400" />
        <h1 className="text-2xl font-bold text-orange-500">Admin Settings</h1>
      </div>
      <p className="text-orange-400/80">Configure system preferences and application settings</p>
      
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-orange-500">Coming Soon: Settings Configuration</CardTitle>
          <CardDescription className="text-zinc-400">Customize your application preferences and system-wide settings</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-zinc-300">This settings dashboard will provide comprehensive configuration options for your application:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-800/60 p-4 rounded-lg border border-zinc-700">
              <h3 className="font-medium text-orange-400 mb-2">Application Settings</h3>
              <p className="text-sm text-zinc-300">Configure global application preferences, themes, and default behaviors.</p>
            </div>
            
            <div className="bg-zinc-800/60 p-4 rounded-lg border border-zinc-700">
              <h3 className="font-medium text-orange-400 mb-2">Notification Settings</h3>
              <p className="text-sm text-zinc-300">Set up email and in-app notification preferences for different events.</p>
            </div>
            
            <div className="bg-zinc-800/60 p-4 rounded-lg border border-zinc-700">
              <h3 className="font-medium text-orange-400 mb-2">Integration Management</h3>
              <p className="text-sm text-zinc-300">Connect and configure third-party integrations and API connections.</p>
            </div>
            
            <div className="bg-zinc-800/60 p-4 rounded-lg border border-zinc-700">
              <h3 className="font-medium text-orange-400 mb-2">System Preferences</h3>
              <p className="text-sm text-zinc-300">Manage system-wide settings, backups, and advanced configurations.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
