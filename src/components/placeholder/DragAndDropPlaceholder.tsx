
import { Trello, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const DragAndDropPlaceholder = () => {
  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-orange-500">Drag and Drop Board</h1>
        <p className="text-orange-400/80 mt-2">Organize orders in a Trello-style kanban board</p>
      </div>

      <Alert className="bg-amber-900/20 border-amber-500/50">
        <AlertCircle className="h-5 w-5 text-amber-500" />
        <AlertTitle className="text-amber-400">Coming Soon</AlertTitle>
        <AlertDescription className="text-zinc-300">
          The Drag and Drop board is currently under development and will be available soon.
          This feature will allow you to visually organize and track orders through each stage of processing using a kanban-style interface.
        </AlertDescription>
      </Alert>

      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-zinc-200 flex items-center">
            <Trello className="mr-2 h-5 w-5 text-orange-500" /> 
            Feature Preview
          </CardTitle>
          <CardDescription className="text-zinc-400">
            When completed, the Drag and Drop board will include these features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border border-dashed border-zinc-700 rounded-lg p-6 bg-zinc-800/30">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* To Pick Column */}
              <div className="bg-zinc-800 rounded-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-yellow-400">To Pick</h3>
                  <div className="bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full text-xs">5</div>
                </div>
                <div className="space-y-2">
                  <div className="h-16 w-full bg-zinc-700 rounded animate-pulse"></div>
                  <div className="h-16 w-full bg-zinc-700 rounded animate-pulse"></div>
                  <div className="h-16 w-full bg-zinc-700 rounded animate-pulse"></div>
                </div>
              </div>
              
              {/* Picked Column */}
              <div className="bg-zinc-800 rounded-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-green-400">Picked</h3>
                  <div className="bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full text-xs">3</div>
                </div>
                <div className="space-y-2">
                  <div className="h-16 w-full bg-zinc-700 rounded animate-pulse"></div>
                  <div className="h-16 w-full bg-zinc-700 rounded animate-pulse"></div>
                </div>
              </div>
              
              {/* To Order Column */}
              <div className="bg-zinc-800 rounded-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-purple-400">To Order</h3>
                  <div className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full text-xs">2</div>
                </div>
                <div className="space-y-2">
                  <div className="h-16 w-full bg-zinc-700 rounded animate-pulse"></div>
                  <div className="h-16 w-full bg-zinc-700 rounded animate-pulse"></div>
                </div>
              </div>
              
              {/* Ordered Column */}
              <div className="bg-zinc-800 rounded-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-blue-400">Ordered</h3>
                  <div className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full text-xs">4</div>
                </div>
                <div className="space-y-2">
                  <div className="h-16 w-full bg-zinc-700 rounded animate-pulse"></div>
                  <div className="h-16 w-full bg-zinc-700 rounded animate-pulse"></div>
                  <div className="h-16 w-full bg-zinc-700 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border border-dashed border-zinc-700 rounded-lg p-6 bg-zinc-800/30">
            <div className="space-y-4">
              <h3 className="font-medium text-orange-400">Key Features</h3>
              <ul className="space-y-2 text-zinc-300">
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                  <span>Drag and drop orders between status columns</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                  <span>Visual progress tracking with color-coded cards</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                  <span>Filter by order details, customer, or date</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                  <span>Quick access to order details and actions</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DragAndDropPlaceholder;
