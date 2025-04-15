
import React from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ActionButtonsProps {
  quantity: number;
  partialQuantity: number;
  isProcessing: boolean;
  onPartialQuantityChange: (value: string) => void;
  onPickFullOrder: () => Promise<void>;
  onOrderFullOrder: () => Promise<void>;
  onPartialPick: () => Promise<void>;
}

const ActionButtons = ({
  quantity,
  partialQuantity,
  isProcessing,
  onPartialQuantityChange,
  onPickFullOrder,
  onOrderFullOrder,
  onPartialPick
}: ActionButtonsProps) => {
  const getQuantityOptions = () => {
    const options = [];
    for (let i = 1; i < quantity; i++) {
      options.push(
        <SelectItem key={i} value={i.toString()}>
          {i}
        </SelectItem>
      );
    }
    return options;
  };

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-orange-400 font-medium mb-2">Choose an Action:</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Button
          onClick={onPickFullOrder}
          disabled={isProcessing}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Pick Full Order ({quantity})
        </Button>
        
        <Button
          onClick={onOrderFullOrder}
          disabled={isProcessing}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Order Full Order from HD
        </Button>
        
        {quantity > 1 && (
          <div className="flex space-x-2">
            <Select 
              value={partialQuantity.toString()} 
              onValueChange={onPartialQuantityChange}
            >
              <SelectTrigger className="w-24 bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Qty" />
              </SelectTrigger>
              <SelectContent>
                {getQuantityOptions()}
              </SelectContent>
            </Select>
            <Button
              onClick={onPartialPick}
              disabled={isProcessing || partialQuantity <= 0}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              Part Pick & Order Rest
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionButtons;
