
import { useState } from "react";
import { useVisualizerData } from "./hooks/useVisualizerData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  RefreshCw, 
  Search, 
  Filter, 
  Calendar, 
  ChevronDown, 
  List, 
  Grid
} from "lucide-react";
import OrderVisualizer from "./components/visualizer/OrderVisualizer";
import OrderList from "./components/visualizer/OrderList";
import { PicklistOrder } from "./types/picklistTypes";
import VisualizerStats from "./components/visualizer/VisualizerStats";
import { format } from "date-fns";

const VisualiserPage = () => {
  const { 
    orders, 
    isLoading, 
    error, 
    refreshData, 
    statusCounts, 
    lastRefreshTime 
  } = useVisualizerData();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "name">("newest");
  
  // Filter and sort orders
  const filteredOrders = orders.filter(order => {
    // Apply search filter
    const searchMatch = 
      searchTerm === "" || 
      order.shopify_order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply status filter
    if (statusFilter === "all") return searchMatch;
    
    // Check if any item has the selected status
    const hasStatus = order.items.some(item => {
      const progress = item.progress?.toLowerCase() || "";
      
      switch(statusFilter) {
        case "toPick": return progress === "to pick";
        case "picking": return progress === "picking";
        case "picked": return progress === "picked";
        case "toOrder": return progress === "to order";
        case "ordered": return progress === "ordered";
        case "toDispatch": return progress === "to dispatch";
        case "fulfilled": return progress === "fulfilled";
        default: return true;
      }
    });
    
    return searchMatch && hasStatus;
  });
  
  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortOrder === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (sortOrder === "oldest") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else {
      return a.customer_name.localeCompare(b.customer_name);
    }
  });
  
  const handleRefresh = () => {
    refreshData();
  };
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy h:mm a");
  };
  
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-orange-500">Order Visualiser</h1>
        <p className="text-orange-400/80">
          Visualize order progress through the system
          {lastRefreshTime && (
            <span className="ml-2 text-sm">
              (Last data refresh: {formatDate(lastRefreshTime)})
            </span>
          )}
        </p>
      </div>
      
      {error ? (
        <Card className="border-red-400 bg-red-50 dark:bg-red-950/30">
          <CardContent className="p-4">
            <p className="text-red-600">Error loading visualizer data: {error}</p>
            <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-2">
              <RefreshCw className="w-4 h-4 mr-2" /> Try Again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Overview */}
          <VisualizerStats 
            isLoading={isLoading} 
            statusCounts={statusCounts} 
            totalOrders={orders.length}
          />
          
          {/* Filter Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search orders by number or customer..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="toPick">To Pick</SelectItem>
                      <SelectItem value="picking">Picking</SelectItem>
                      <SelectItem value="picked">Picked</SelectItem>
                      <SelectItem value="toOrder">To Order</SelectItem>
                      <SelectItem value="ordered">Ordered</SelectItem>
                      <SelectItem value="toDispatch">To Dispatch</SelectItem>
                      <SelectItem value="fulfilled">Fulfilled</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortOrder} onValueChange={(value: "newest" | "oldest" | "name") => setSortOrder(value)}>
                    <SelectTrigger className="w-[160px]">
                      <ChevronDown className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="name">Customer Name</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex border rounded-md">
                    <Button 
                      variant={viewMode === "cards" ? "default" : "ghost"} 
                      size="sm"
                      onClick={() => setViewMode("cards")}
                      className="rounded-r-none"
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant={viewMode === "list" ? "default" : "ghost"} 
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-l-none"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <Button size="sm" variant="outline" onClick={handleRefresh}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
              
              {filteredOrders.length > 0 && (
                <div className="mt-4">
                  <Badge variant="outline" className="text-xs">
                    {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Orders Display */}
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="space-y-2">
                      <Skeleton className="h-6 w-[250px]" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">No orders match your current filters</p>
              </CardContent>
            </Card>
          ) : viewMode === "cards" ? (
            <OrderVisualizer orders={sortedOrders} />
          ) : (
            <OrderList orders={sortedOrders} />
          )}
        </>
      )}
    </div>
  );
};

export default VisualiserPage;
