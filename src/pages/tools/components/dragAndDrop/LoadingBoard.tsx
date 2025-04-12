
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const LoadingBoard: React.FC = () => {
  // Setup columns
  const columns = [
    { id: "to-pick", title: "To Pick" },
    { id: "picked", title: "Picked" },
    { id: "to-order", title: "To Order" },
    { id: "ordered", title: "Ordered" },
    { id: "to-dispatch", title: "To Dispatch" }
  ];
  
  return (
    <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4">
      {columns.map(column => (
        <div 
          key={column.id}
          className="flex-shrink-0 w-full md:w-80 h-full rounded-md flex flex-col bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50"
        >
          <div className="flex items-center justify-between p-3 border-b border-zinc-700">
            <h3 className="font-medium text-zinc-300">{column.title}</h3>
            <div className="px-2 py-0.5 rounded-full text-xs bg-zinc-700 text-zinc-400">
              ...
            </div>
          </div>
          
          <div className="flex-1 p-2 space-y-2 max-h-[calc(100vh-300px)]">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="p-3 rounded-md border border-zinc-700 bg-zinc-800">
                <div className="flex justify-between items-start mb-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/5" />
                </div>
                
                <div className="space-y-2 mt-3">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingBoard;
