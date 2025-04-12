
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search, Filter } from "lucide-react";
import { useDragAndDropData } from "./hooks/useDragAndDropData";
import DragAndDropBoard from "./components/dragAndDrop/DragAndDropBoard";
import LoadingBoard from "./components/dragAndDrop/LoadingBoard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const DragAndDropPage = () => {
  const { toast } = useToast();
  const { 
    orderItems, 
    isLoading, 
    error, 
    refreshData, 
    lastRefreshTime 
  } = useDragAndDropData();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Filter order items
  const filteredOrderItems = orderItems.filter(item => {
    // Apply search filter
    const searchMatch = 
      searchTerm === "" || 
      item.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply status filter
    if (statusFilter === "all") return searchMatch;
    
    return searchMatch && item.progress?.toLowerCase() === statusFilter.toLowerCase();
  });
  
  const handleRefresh = () => {
    refreshData();
    toast({
      title: "Refreshing data",
      description: "The board data is being refreshed",
    });
  };
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy h:mm a");
  };
  
  if (error) {
    return (
      <div className="space-y-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-orange-500">Drag and Drop Board</h1>
          <p className="text-orange-400/80">
            Organize order items in a Trello-style kanban board
          </p>
        </div>
        
        <Card className="border-red-400 bg-red-50 dark:bg-red-950/30">
          <CardContent className="p-4">
            <p className="text-red-600">Error loading drag and drop data: {error}</p>
            <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-2">
              <RefreshCw className="w-4 h-4 mr-2" /> Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-orange-500">Drag and Drop Board</h1>
        <p className="text-orange-400/80">
          Organize order items in a Trello-style kanban board
          {lastRefreshTime && (
            <span className="ml-2 text-sm">
              (Last data refresh: {formatDate(lastRefreshTime)})
            </span>
          )}
        </p>
      </div>
      
      {/* Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search by order number, customer, item title, or SKU..."
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
                  <SelectItem value="to pick">To Pick</SelectItem>
                  <SelectItem value="picked">Picked</SelectItem>
                  <SelectItem value="to order">To Order</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="to dispatch">To Dispatch</SelectItem>
                </SelectContent>
              </Select>
              
              <Button size="sm" variant="outline" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? <LoadingBoard /> : (
        <DragAndDropBoard 
          orderItems={filteredOrderItems} 
          refreshData={refreshData}
        />
      )}
    </div>
  );
};

export default DragAndDropPage;
