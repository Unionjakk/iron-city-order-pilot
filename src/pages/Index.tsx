import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ShoppingBag, 
  CheckCircle, 
  ShoppingCart, 
  Truck, 
  PackageCheck, 
  Package, 
  Users, 
  Settings, 
  Upload,
  BarChart3,
  Search
} from "lucide-react";

const Index = () => {
  return (
    <div className="space-y-8 p-4">
      <div>
        <h1 className="text-3xl font-bold text-orange-500">Dashboard</h1>
        <p className="text-orange-400/80 mt-2">Manage your Harley-Davidson orders and inventory</p>
      </div>

      {/* Progress Buttons Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-zinc-200">Order Progress</h2>
        <div className="space-y-4">
          {/* To Pick */}
          <div className="flex flex-col md:flex-row gap-4">
            <Link to="/actions/picklist" className="md:w-1/3">
              <Card className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 transition-colors cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <ShoppingBag className="h-10 w-10 text-orange-500 mb-3" />
                  <h3 className="text-lg font-medium text-white mb-2">To Pick</h3>
                  <p className="text-zinc-400 text-sm">Manage orders ready to be picked from inventory</p>
                </CardContent>
              </Card>
            </Link>
            <Card className="bg-zinc-800 border-zinc-700 md:w-2/3">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-white mb-2">Pick Stats</h3>
                <p className="text-zinc-400">Coming soon</p>
              </CardContent>
            </Card>
          </div>

          {/* Picked */}
          <div className="flex flex-col md:flex-row gap-4">
            <Link to="/actions/picked" className="md:w-1/3">
              <Card className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 transition-colors cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <CheckCircle className="h-10 w-10 text-orange-500 mb-3" />
                  <h3 className="text-lg font-medium text-white mb-2">Picked</h3>
                  <p className="text-zinc-400 text-sm">View all orders that have been picked</p>
                </CardContent>
              </Card>
            </Link>
            <Card className="bg-zinc-800 border-zinc-700 md:w-2/3">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-white mb-2">Picked Stats</h3>
                <p className="text-zinc-400">Coming soon</p>
              </CardContent>
            </Card>
          </div>

          {/* To Order */}
          <div className="flex flex-col md:flex-row gap-4">
            <Link to="/actions/toorder" className="md:w-1/3">
              <Card className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 transition-colors cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <ShoppingCart className="h-10 w-10 text-orange-500 mb-3" />
                  <h3 className="text-lg font-medium text-white mb-2">To Order</h3>
                  <p className="text-zinc-400 text-sm">Manage orders that need to be ordered from suppliers</p>
                </CardContent>
              </Card>
            </Link>
            <Card className="bg-zinc-800 border-zinc-700 md:w-2/3">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-white mb-2">Order Stats</h3>
                <p className="text-zinc-400">Coming soon</p>
              </CardContent>
            </Card>
          </div>

          {/* Ordered */}
          <div className="flex flex-col md:flex-row gap-4">
            <Link to="/actions/ordered" className="md:w-1/3">
              <Card className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 transition-colors cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <PackageCheck className="h-10 w-10 text-orange-500 mb-3" />
                  <h3 className="text-lg font-medium text-white mb-2">Ordered</h3>
                  <p className="text-zinc-400 text-sm">View all orders that have been placed with suppliers</p>
                </CardContent>
              </Card>
            </Link>
            <Card className="bg-zinc-800 border-zinc-700 md:w-2/3">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-white mb-2">Ordered Stats</h3>
                <p className="text-zinc-400">Coming soon</p>
              </CardContent>
            </Card>
          </div>

          {/* To Dispatch */}
          <div className="flex flex-col md:flex-row gap-4">
            <Link to="/actions/dispatch" className="md:w-1/3">
              <Card className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 transition-colors cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Truck className="h-10 w-10 text-orange-500 mb-3" />
                  <h3 className="text-lg font-medium text-white mb-2">To Dispatch</h3>
                  <p className="text-zinc-400 text-sm">Manage orders ready to be dispatched to customers</p>
                </CardContent>
              </Card>
            </Link>
            <Card className="bg-zinc-800 border-zinc-700 md:w-2/3">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-white mb-2">Dispatch Stats</h3>
                <p className="text-zinc-400">Coming soon</p>
              </CardContent>
            </Card>
          </div>

          {/* Back Order Report */}
          <div className="flex flex-col md:flex-row gap-4">
            <Link to="/actions/backorder-report" className="md:w-1/3">
              <Card className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 transition-colors cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Package className="h-10 w-10 text-orange-500 mb-3" />
                  <h3 className="text-lg font-medium text-white mb-2">Back Order Report</h3>
                  <p className="text-zinc-400 text-sm">View detailed back order reports</p>
                </CardContent>
              </Card>
            </Link>
            <Card className="bg-zinc-800 border-zinc-700 md:w-2/3">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-white mb-2">Backorder Stats</h3>
                <p className="text-zinc-400">Coming soon</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Other Tools Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-zinc-200">Other Tools</h2>
        <div className="flex flex-col md:flex-row justify-center gap-4">
          <Link to="/visualiser" className="w-full md:w-1/2 lg:w-1/3">
            <Card className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 transition-colors cursor-pointer h-full">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <BarChart3 className="h-10 w-10 text-orange-500 mb-3" />
                <h3 className="text-lg font-medium text-white mb-2">Visualiser</h3>
                <p className="text-zinc-400 text-sm">Visualize order progress through the system</p>
              </CardContent>
            </Card>
          </Link>
          <div className="w-full md:w-1/2 lg:w-1/3">
            <Card className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700/50 transition-colors cursor-not-allowed h-full">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Search className="h-10 w-10 text-orange-500/60 mb-3" />
                <h3 className="text-lg font-medium text-white mb-2">Order Lookup</h3>
                <p className="text-zinc-400 text-sm">Search for orders by number, customer email, or name</p>
                <span className="mt-2 text-xs px-2 py-1 bg-amber-500/20 text-amber-300 rounded-full">Coming Soon</span>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Admin Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-zinc-200">Admin</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin">
            <Button variant="outline" className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700">
              <Upload className="h-4 w-4 mr-2" />
              Uploads
            </Button>
          </Link>
          <Link to="/users">
            <Button variant="outline" className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700">
              <Users className="h-4 w-4 mr-2" />
              Users
            </Button>
          </Link>
          <Link to="/admin/settings">
            <Button variant="outline" className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
