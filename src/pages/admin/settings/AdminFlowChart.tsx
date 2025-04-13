
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Package, ShoppingCart, Truck, CheckCircle, RotateCw, AlertTriangle, Clock, Upload, Download, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AdminFlowChart = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-orange-500">Action Flow Chart</h1>
          <p className="text-orange-400/80">Visualization of the order processing workflow</p>
        </div>
        <Link to="/admin/settings">
          <Button variant="outline" className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700">
            Back to Settings
          </Button>
        </Link>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-orange-500">Order Processing Workflow</CardTitle>
          <CardDescription className="text-zinc-400">
            Flow chart of the Leeds Iron City Motorcycles order processing system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <div className="min-w-[900px] p-4">
              {/* Flow Chart Container */}
              <div className="relative">
                {/* Shopify Import Section */}
                <div className="flow-section bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 mb-8 relative">
                  <h3 className="text-blue-400 font-semibold flex items-center mb-3">
                    <Download className="h-5 w-5 mr-2" />
                    Daily Shopify Import
                  </h3>
                  <p className="text-zinc-400 text-sm mb-4">
                    Unfulfilled orders are imported daily from Shopify via API integration. 
                    Previous data is destroyed and rebuilt each day.
                  </p>
                  <div className="bg-zinc-700/50 p-3 rounded-md text-sm text-zinc-300">
                    <div className="font-mono text-xs text-zinc-400 mb-1">System Action:</div>
                    Orders with status "unfulfilled" are imported and filtered for Leeds Iron City Motorcycles location (ID: 53277786267)
                  </div>
                  
                  {/* Arrow down */}
                  <div className="absolute left-1/2 -ml-3 bottom-0 transform translate-y-full flex flex-col items-center">
                    <ArrowRight className="h-6 w-6 text-zinc-500 transform rotate-90" />
                  </div>
                </div>

                {/* To Pick Section */}
                <div className="flow-section bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 mb-8 relative">
                  <h3 className="text-orange-400 font-semibold flex items-center mb-2">
                    <Package className="h-5 w-5 mr-2" />
                    To Pick
                    <span className="text-xs text-zinc-400 ml-2">(/actions/picklist)</span>
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-zinc-700/30 p-3 rounded-md">
                      <div className="font-semibold text-zinc-300 mb-2">System Actions:</div>
                      <ul className="text-sm text-zinc-400 space-y-2 list-disc pl-5">
                        <li>Dashboard displays all unfulfilled orders for Leeds location</li>
                        <li>Users can see stock availability for each item</li>
                        <li>Items can be marked as "Picked" or "To Order" based on availability</li>
                      </ul>
                    </div>
                    
                    <div className="bg-zinc-700/30 p-3 rounded-md">
                      <div className="font-semibold text-orange-300 mb-2">Physical Actions:</div>
                      <ul className="text-sm text-zinc-400 space-y-2 list-disc pl-5">
                        <li>Staff checks physical stock against system inventory</li>
                        <li>Items that are in stock are physically retrieved from storage</li>
                        <li>Retrieved items are moved to a separate storage area</li>
                      </ul>
                    </div>
                  </div>
                  
                  {/* Decision point with two arrows */}
                  <div className="relative h-12 mb-4">
                    <div className="absolute left-1/4 top-0 transform -translate-x-1/2 h-full flex flex-col items-center">
                      <div className="text-xs text-center text-green-400 mb-1">Items in stock</div>
                      <ArrowRight className="h-6 w-6 text-green-500 transform rotate-90" />
                    </div>
                    
                    <div className="absolute left-3/4 top-0 transform -translate-x-1/2 h-full flex flex-col items-center">
                      <div className="text-xs text-center text-amber-400 mb-1">Items not in stock</div>
                      <ArrowRight className="h-6 w-6 text-amber-500 transform rotate-90" />
                    </div>
                  </div>
                  
                  {/* The two paths */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flow-path">
                      <div className="text-center p-2 bg-green-900/20 border border-green-900 rounded-md text-green-400 font-medium">
                        Mark as "Picked"
                      </div>
                    </div>
                    
                    <div className="flow-path">
                      <div className="text-center p-2 bg-amber-900/20 border border-amber-900 rounded-md text-amber-400 font-medium">
                        Mark as "To Order"
                      </div>
                    </div>
                  </div>
                  
                  {/* Arrows down */}
                  <div className="grid grid-cols-2 gap-4 h-12 relative">
                    <div className="flex justify-center">
                      <ArrowRight className="h-6 w-6 text-green-500 transform rotate-90" />
                    </div>
                    
                    <div className="flex justify-center">
                      <ArrowRight className="h-6 w-6 text-amber-500 transform rotate-90" />
                    </div>
                  </div>
                </div>
                
                {/* Picked and To Order sections side by side */}
                <div className="grid grid-cols-2 gap-12 mb-8">
                  {/* Picked Section */}
                  <div className="flow-section bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 relative">
                    <h3 className="text-green-400 font-semibold flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Picked
                      <span className="text-xs text-zinc-400 ml-2">(/actions/picked)</span>
                    </h3>
                    
                    <div className="bg-zinc-700/30 p-3 rounded-md mb-4">
                      <div className="font-semibold text-zinc-300 mb-2">System Actions:</div>
                      <ul className="text-sm text-zinc-400 space-y-2 list-disc pl-5">
                        <li>Items marked as "Picked" appear in this report</li>
                        <li>System tracks which items have been physically picked</li>
                        <li>Complete orders (all items picked) can be moved to Dispatch</li>
                      </ul>
                    </div>
                    
                    <div className="bg-zinc-700/30 p-3 rounded-md">
                      <div className="font-semibold text-green-300 mb-2">Physical Actions:</div>
                      <ul className="text-sm text-zinc-400 space-y-2 list-disc pl-5">
                        <li>Items are stored in the designated area for picked items</li>
                        <li>Staff waits for all items in an order to be picked or received</li>
                      </ul>
                    </div>
                    
                    {/* Arrow pointing to "When complete" */}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full flex flex-col items-center h-12">
                      <div className="text-xs text-center text-zinc-400 mb-1">When all items in order are picked</div>
                      <ArrowRight className="h-6 w-6 text-zinc-500 transform rotate-90" />
                    </div>
                  </div>
                  
                  {/* To Order Section */}
                  <div className="flow-section bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 relative">
                    <h3 className="text-amber-400 font-semibold flex items-center mb-2">
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      To Order
                      <span className="text-xs text-zinc-400 ml-2">(/actions/to-order)</span>
                    </h3>
                    
                    <div className="bg-zinc-700/30 p-3 rounded-md mb-4">
                      <div className="font-semibold text-zinc-300 mb-2">System Actions:</div>
                      <ul className="text-sm text-zinc-400 space-y-2 list-disc pl-5">
                        <li>Items marked as "To Order" appear in this report</li>
                        <li>Items awaiting order from Harley Davidson</li>
                        <li>Items can be marked as "Ordered" once placed on HD website</li>
                      </ul>
                    </div>
                    
                    <div className="bg-zinc-700/30 p-3 rounded-md">
                      <div className="font-semibold text-amber-300 mb-2">Physical Actions:</div>
                      <ul className="text-sm text-zinc-400 space-y-2 list-disc pl-5">
                        <li>Staff places orders on Harley Davidson website</li>
                        <li>Orders are tracked in separate HD system</li>
                        <li>Exports from HD must be imported to update system</li>
                      </ul>
                    </div>
                    
                    {/* Arrow down */}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full flex flex-col items-center h-12">
                      <div className="text-xs text-center text-zinc-400 mb-1">After placing order on HD website</div>
                      <ArrowRight className="h-6 w-6 text-zinc-500 transform rotate-90" />
                    </div>
                  </div>
                </div>
                
                {/* Ordered Section */}
                <div className="flow-section bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 mb-8 relative ml-[50%] w-[50%]">
                  <h3 className="text-blue-400 font-semibold flex items-center mb-2">
                    <Clock className="h-5 w-5 mr-2" />
                    Ordered
                    <span className="text-xs text-zinc-400 ml-2">(/actions/ordered)</span>
                  </h3>
                  
                  <div className="bg-zinc-700/30 p-3 rounded-md mb-4">
                    <div className="font-semibold text-zinc-300 mb-2">System Actions:</div>
                    <ul className="text-sm text-zinc-400 space-y-2 list-disc pl-5">
                      <li>Items marked as "Ordered" appear in this report</li>
                      <li>System tracks which items are on order from Harley Davidson</li>
                      <li>Importing HD files updates order status (arrived/backorder)</li>
                      <li>Items that arrive can be marked as "Picked"</li>
                    </ul>
                  </div>
                  
                  <div className="bg-zinc-700/30 p-3 rounded-md">
                    <div className="font-semibold text-blue-300 mb-2">Physical Actions:</div>
                    <ul className="text-sm text-zinc-400 space-y-2 list-disc pl-5">
                      <li>Staff monitors for arrival of ordered items</li>
                      <li>Items arriving from HD are checked against orders</li>
                      <li>Items that arrive are moved to the picked storage area</li>
                      <li>Import of HD files is required to keep system updated</li>
                    </ul>
                  </div>
                  
                  {/* Decision point with two arrows */}
                  <div className="relative h-12 mt-4">
                    <div className="absolute left-1/4 top-0 transform -translate-x-1/2 h-full flex flex-col items-center">
                      <div className="text-xs text-center text-green-400 mb-1">When item arrives</div>
                      <ArrowRight className="h-6 w-6 text-green-500 transform -rotate-135" />
                    </div>
                    
                    <div className="absolute right-1/4 top-0 transform translate-x-1/2 h-full flex flex-col items-center">
                      <div className="text-xs text-center text-red-400 mb-1">If backordered</div>
                      <div className="text-xs text-center text-red-400">(long delay)</div>
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-1" />
                    </div>
                  </div>
                  
                  {/* Arrow back to Picked */}
                  <div className="absolute -left-12 bottom-1/2 transform translate-y-1/2 w-12">
                    <ArrowRight className="h-6 w-6 text-green-500" />
                  </div>
                </div>
                
                {/* To Dispatch Section (appears when all items in an order are picked) */}
                <div className="flow-section bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 mb-8 relative ml-[25%] w-[50%]">
                  <h3 className="text-purple-400 font-semibold flex items-center mb-2">
                    <Truck className="h-5 w-5 mr-2" />
                    To Dispatch
                    <span className="text-xs text-zinc-400 ml-2">(/actions/dispatch)</span>
                  </h3>
                  
                  <div className="bg-zinc-700/30 p-3 rounded-md mb-4">
                    <div className="font-semibold text-zinc-300 mb-2">System Actions:</div>
                    <ul className="text-sm text-zinc-400 space-y-2 list-disc pl-5">
                      <li>Complete orders with all items picked appear here</li>
                      <li>Final step in the internal system workflow</li>
                      <li>Orders ready to be marked as fulfilled in Shopify</li>
                    </ul>
                  </div>
                  
                  <div className="bg-zinc-700/30 p-3 rounded-md">
                    <div className="font-semibold text-purple-300 mb-2">Physical Actions:</div>
                    <ul className="text-sm text-zinc-400 space-y-2 list-disc pl-5">
                      <li>Staff packages all picked items for shipping</li>
                      <li>Packages are prepared for DPD collection</li>
                      <li>Staff returns to Shopify to mark order as fulfilled</li>
                    </ul>
                  </div>
                  
                  {/* Arrow down */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full flex flex-col items-center h-12">
                    <ArrowRight className="h-6 w-6 text-zinc-500 transform rotate-90" />
                  </div>
                </div>
                
                {/* Shopify Fulfillment Section */}
                <div className="flow-section bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 mb-8 relative ml-[25%] w-[50%]">
                  <h3 className="text-emerald-400 font-semibold flex items-center mb-2">
                    <ExternalLink className="h-5 w-5 mr-2" />
                    Shopify Fulfillment
                  </h3>
                  
                  <div className="bg-zinc-700/30 p-3 rounded-md mb-4">
                    <div className="font-semibold text-zinc-300 mb-2">System Actions:</div>
                    <ul className="text-sm text-zinc-400 space-y-2 list-disc pl-5">
                      <li>Staff returns to Shopify to mark the order as fulfilled</li>
                      <li>This action happens outside our system in Shopify</li>
                      <li>Order status in Shopify changes to "fulfilled"</li>
                    </ul>
                  </div>
                  
                  <div className="flex justify-center mt-4">
                    <div className="px-4 py-2 bg-zinc-700/50 rounded-md text-zinc-300 text-sm inline-flex items-center">
                      <RotateCw className="h-4 w-4 mr-2 text-zinc-400" />
                      Process Complete
                    </div>
                  </div>
                </div>
                
                {/* Future Development */}
                <div className="border border-dashed border-zinc-700 rounded-lg p-4 bg-zinc-800/20">
                  <h3 className="text-zinc-300 font-semibold flex items-center mb-2">
                    <Clock className="h-5 w-5 mr-2 text-zinc-400" />
                    Future Development
                  </h3>
                  
                  <div className="p-3 rounded-md">
                    <ul className="text-sm text-zinc-400 space-y-2 list-disc pl-5">
                      <li>DPD tracking integration to monitor delivery status</li>
                      <li>Automated status updates based on DPD tracking events</li>
                      <li>Ability to track when items are delivered to customers</li>
                      <li>Complete end-to-end visibility from order to delivery</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="bg-amber-900/20 border border-amber-900/50 rounded-md p-4 text-amber-200">
        <h3 className="font-medium flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-amber-400" />
          Important Notes
        </h3>
        <ul className="mt-2 space-y-2 text-sm text-amber-200/80 list-disc pl-5">
          <li>This flow is specific to Leeds Iron City Motorcycles location only</li>
          <li>The system focuses exclusively on unfulfilled Shopify orders</li>
          <li>Harley Davidson has a separate ordering system that must be used manually</li>
          <li>Files exported from Harley Davidson must be imported to keep our system updated</li>
          <li>All physical actions (picking, storing, packing) occur outside the system</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminFlowChart;
