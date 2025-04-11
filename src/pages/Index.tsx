
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
  BarChart3
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
        <div className="grid grid-cols-1 gap-4">
          {/* To Pick */}
          <Link to="/actions/picklist">
            <Card className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 transition-colors cursor-pointer">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <ShoppingBag className="h-10 w-10 text-orange-500 mb-3" />
                <h3 className="text-lg font-medium text-white mb-2">To Pick</h3>
                <p className="text-zinc-400 text-sm">Manage orders ready to be picked from inventory</p>
              </CardContent>
            </Card>
          </Link>

          {/* Picked */}
          <Link to="/actions/picked">
            <Card className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 transition-colors cursor-pointer">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <CheckCircle className="h-10 w-10 text-orange-500 mb-3" />
                <h3 className="text-lg font-medium text-white mb-2">Picked</h3>
                <p className="text-zinc-400 text-sm">View all orders that have been picked</p>
              </CardContent>
            </Card>
          </Link>

          {/* To Order */}
          <Link to="/actions/toorder">
            <Card className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 transition-colors cursor-pointer">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <ShoppingCart className="h-10 w-10 text-orange-500 mb-3" />
                <h3 className="text-lg font-medium text-white mb-2">To Order</h3>
                <p className="text-zinc-400 text-sm">Manage orders that need to be ordered from suppliers</p>
              </CardContent>
            </Card>
          </Link>

          {/* Ordered */}
          <Link to="/actions/ordered">
            <Card className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 transition-colors cursor-pointer">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <PackageCheck className="h-10 w-10 text-orange-500 mb-3" />
                <h3 className="text-lg font-medium text-white mb-2">Ordered</h3>
                <p className="text-zinc-400 text-sm">View all orders that have been placed with suppliers</p>
              </CardContent>
            </Card>
          </Link>

          {/* To Dispatch */}
          <Link to="/actions/dispatch">
            <Card className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 transition-colors cursor-pointer">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Truck className="h-10 w-10 text-orange-500 mb-3" />
                <h3 className="text-lg font-medium text-white mb-2">To Dispatch</h3>
                <p className="text-zinc-400 text-sm">Manage orders ready to be dispatched to customers</p>
              </CardContent>
            </Card>
          </Link>

          {/* Back Order Report */}
          <Link to="/actions/backorder-report">
            <Card className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 transition-colors cursor-pointer">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Package className="h-10 w-10 text-orange-500 mb-3" />
                <h3 className="text-lg font-medium text-white mb-2">Back Order Report</h3>
                <p className="text-zinc-400 text-sm">View detailed back order reports</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* Visual Order Progressor Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-zinc-200">Visual Order Progressor</h2>
        <div className="grid grid-cols-1 gap-4">
          <Link to="/visualiser">
            <Card className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 transition-colors cursor-pointer">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <BarChart3 className="h-10 w-10 text-orange-500 mb-3" />
                <h3 className="text-lg font-medium text-white mb-2">Visualiser</h3>
                <p className="text-zinc-400 text-sm">Visualize order progress through the system</p>
              </CardContent>
            </Card>
          </Link>
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
