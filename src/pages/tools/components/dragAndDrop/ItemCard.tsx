
import React from "react";
import { Package, ShoppingCart, User, Calendar, Tag, DollarSign, Clipboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { formatCurrency } from "../../utils/formatUtils";
import { DragAndDropOrderItem } from "../../types/dragAndDropTypes";

interface ItemCardProps {
  item: DragAndDropOrderItem;
  isDragging?: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, isDragging = false }) => {
  // Helper for progress status color
  const getStatusColor = () => {
    const status = item.progress.toLowerCase();
    
    switch (status) {
      case "to pick":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
      case "picked":
        return "bg-green-500/20 text-green-300 border-green-500/50";
      case "to order":
        return "bg-purple-500/20 text-purple-300 border-purple-500/50";
      case "ordered":
        return "bg-blue-500/20 text-blue-300 border-blue-500/50";
      case "to dispatch":
        return "bg-pink-500/20 text-pink-300 border-pink-500/50";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/50";
    }
  };
  
  // Format date helper
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };
  
  return (
    <div 
      className={`p-3 rounded-md bg-zinc-700/50 border border-zinc-700 hover:border-zinc-500 transition-colors cursor-grab ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex justify-between items-start mb-1.5">
        <div className="text-sm font-medium truncate mr-2">{item.title}</div>
        <Badge className={`text-xs ${getStatusColor()}`}>{item.progress}</Badge>
      </div>
      
      <div className="space-y-1 text-xs text-zinc-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ShoppingCart className="h-3 w-3 mr-1" />
            <span className="text-zinc-300">#{item.orderNumber}</span>
          </div>
          <div>
            <span className="text-zinc-300">Qty: {item.quantity}</span>
          </div>
        </div>
        
        <div className="flex items-center">
          <User className="h-3 w-3 mr-1" />
          <span className="truncate">{item.customerName}</span>
        </div>
        
        <div className="flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          <span>{formatDate(item.createdAt)}</span>
        </div>
        
        {item.sku && (
          <div className="flex items-center">
            <Tag className="h-3 w-3 mr-1" />
            <span className="font-mono">{item.sku}</span>
          </div>
        )}
        
        {item.price && (
          <div className="flex items-center">
            <DollarSign className="h-3 w-3 mr-1" />
            <span>{formatCurrency(item.price)}</span>
          </div>
        )}
        
        {item.dealer_po_number && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center">
                  <Clipboard className="h-3 w-3 mr-1" />
                  <span className="truncate">PO: {item.dealer_po_number}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Dealer PO: {item.dealer_po_number}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {item.notes && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="text-zinc-400 italic mt-1 truncate">
                  Note: {item.notes}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{item.notes}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};

export default ItemCard;
