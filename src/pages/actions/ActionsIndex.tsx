import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Package, ShoppingCart, Truck, ClipboardList, FileText, AlertTriangle, List } from "lucide-react";

const ActionsIndex = () => {
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Order Actions</h1>
        <p className="text-gray-500">Manage and process orders through different stages</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Picklist Card */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-blue-500">
              <ShoppingCart className="mr-2 h-5 w-5" /> Picklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">View and manage items ready to be picked</p>
          </CardContent>
          <CardFooter>
            <Link to="/actions/picklist">
              <Button variant="outline">View Picklist</Button>
            </Link>
          </CardFooter>
        </Card>
        
        {/* To Order Card */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-purple-500">
              <Globe className="mr-2 h-5 w-5" /> To Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Process items that need to be ordered</p>
          </CardContent>
          <CardFooter>
            <Link to="/actions/to-order">
              <Button variant="outline">View To Order</Button>
            </Link>
          </CardFooter>
        </Card>
        
        {/* Ordered Card */}
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-indigo-500">
              <ClipboardList className="mr-2 h-5 w-5" /> Ordered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Track items that have been ordered</p>
          </CardContent>
          <CardFooter>
            <Link to="/actions/ordered">
              <Button variant="outline">View Ordered</Button>
            </Link>
          </CardFooter>
        </Card>
        
        {/* Picked Card */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-green-500">
              <Package className="mr-2 h-5 w-5" /> Picked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Manage items that have been picked</p>
          </CardContent>
          <CardFooter>
            <Link to="/actions/picked">
              <Button variant="outline">View Picked</Button>
            </Link>
          </CardFooter>
        </Card>
        
        {/* Dispatch Card */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-orange-500">
              <Truck className="mr-2 h-5 w-5" /> Dispatch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Process items ready for dispatch</p>
          </CardContent>
          <CardFooter>
            <Link to="/actions/dispatch">
              <Button variant="outline">View Dispatch</Button>
            </Link>
          </CardFooter>
        </Card>
        
        {/* Visualiser Card */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-amber-500">
              <List className="mr-2 h-5 w-5" /> Order Visualiser
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Visualize all orders and their progress</p>
          </CardContent>
          <CardFooter>
            <Link to="/actions/visualiser">
              <Button variant="outline">View Visualiser</Button>
            </Link>
          </CardFooter>
        </Card>
        
        {/* Backorder Card */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-red-500">
              <AlertTriangle className="mr-2 h-5 w-5" /> Backorder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Process and manage backorders</p>
          </CardContent>
          <CardFooter>
            <Link to="/actions/backorder">
              <Button variant="outline">View Backorders</Button>
            </Link>
          </CardFooter>
        </Card>
        
        {/* Backorder Report Card */}
        <Card className="border-l-4 border-l-gray-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-gray-500">
              <FileText className="mr-2 h-5 w-5" /> Backorder Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">View backorder reports</p>
          </CardContent>
          <CardFooter>
            <Link to="/actions/backorder-report">
              <Button variant="outline">View Report</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ActionsIndex;
