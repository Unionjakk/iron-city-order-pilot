
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Dashboard = () => {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-zinc-900">
      <header className="bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-orange-500">Iron City Shopify</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-orange-300">
              Welcome, {user?.user_metadata.full_name || 'User'}
            </span>
            <Button variant="outline" size="sm" onClick={signOut} 
              className="border-zinc-700 text-orange-400 hover:bg-zinc-800 hover:text-orange-300">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-orange-500 mb-6">Coming Soon: Iron City Shopify Order System</h2>
          
          <Card className="mb-6 border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-orange-500">System Overview</CardTitle>
              <CardDescription className="text-zinc-400">Automating your Harley Davidson parts ordering workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-lg text-orange-400 mb-2">Data Import Automation</h3>
                <p className="text-zinc-300">Our system will automatically import and process data from multiple sources:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-zinc-300">
                  <li>Unfulfilled Shopify orders for Harley Davidson parts</li>
                  <li>Pinnacle system stock data (via scheduled upload)</li>
                  <li>Harley Davidson reports (backorders, open orders, and detailed order information)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-lg text-orange-400 mb-2">Streamlined Workflow</h3>
                <p className="text-zinc-300">The system will automate these critical processes:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-zinc-300">
                  <li>Intelligent comparison of incoming orders against your local Pinnacle inventory</li>
                  <li>Automatic generation of "to be picked" reports for items currently in stock</li>
                  <li>Sophisticated tracking system for items that need to be ordered from Harley Davidson</li>
                  <li>Specialized handling for backorders and obsolete item management</li>
                  <li>Integrated customer communication through your existing Shopify platform</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-lg text-orange-400 mb-2">Enhanced Problem Management</h3>
                <p className="text-zinc-300">Our system will intelligently handle special cases:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-zinc-300">
                  <li><strong className="text-orange-300">Backorders:</strong> Automated customer communication with waiting confirmation</li>
                  <li><strong className="text-orange-300">Obsolete Items:</strong> Streamlined refund processing with historical tracking</li>
                  <li><strong className="text-orange-300">Inventory Discrepancies:</strong> Intelligent alerting for manual verification</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-orange-500">Key Features Under Development</CardTitle>
              <CardDescription className="text-zinc-400">Transforming your order fulfillment process</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-zinc-800/60 p-4 rounded-lg border border-zinc-700">
                  <h3 className="font-medium text-orange-400 mb-2">Centralized Data Hub</h3>
                  <p className="text-sm text-zinc-300">Seamlessly integrate and synchronize data from Shopify, Pinnacle, and Harley Davidson reports in one unified platform.</p>
                </div>
                
                <div className="bg-zinc-800/60 p-4 rounded-lg border border-zinc-700">
                  <h3 className="font-medium text-orange-400 mb-2">Intelligent Inventory Matching</h3>
                  <p className="text-sm text-zinc-300">Automatically verify stock availability against your Pinnacle data without manual cross-referencing.</p>
                </div>
                
                <div className="bg-zinc-800/60 p-4 rounded-lg border border-zinc-700">
                  <h3 className="font-medium text-orange-400 mb-2">Dynamic Picking Reports</h3>
                  <p className="text-sm text-zinc-300">Generate optimized picking lists for warehouse staff based on current inventory status.</p>
                </div>
                
                <div className="bg-zinc-800/60 p-4 rounded-lg border border-zinc-700">
                  <h3 className="font-medium text-orange-400 mb-2">Order Lifecycle Tracking</h3>
                  <p className="text-sm text-zinc-300">Monitor every order from placement through fulfillment with detailed status visibility.</p>
                </div>
                
                <div className="bg-zinc-800/60 p-4 rounded-lg border border-zinc-700">
                  <h3 className="font-medium text-orange-400 mb-2">Exception Management</h3>
                  <p className="text-sm text-zinc-300">Streamlined handling of backorders, obsolete items, and other special cases with automated customer communication.</p>
                </div>
                
                <div className="bg-zinc-800/60 p-4 rounded-lg border border-zinc-700">
                  <h3 className="font-medium text-orange-400 mb-2">Historical Data Analysis</h3>
                  <p className="text-sm text-zinc-300">Access comprehensive order history and performance metrics to optimize your inventory management.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      
      <footer className="bg-zinc-900/80 backdrop-blur-sm border-t border-zinc-800 py-4 text-center text-zinc-500">
        <p>© {new Date().getFullYear()} Iron City Shopify. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Dashboard;
