
import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PicklistItemActionsProps {
  maxQuantity: number;
  onActionChange: (value: string) => void;
  onPickQuantityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  action: string;
  pickQuantity: number;
  processing: boolean;
}

const PicklistItemActions = ({
  maxQuantity,
  onActionChange,
  onPickQuantityChange,
  onSubmit,
  action,
  pickQuantity,
  processing
}: PicklistItemActionsProps) => {
  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Select 
            value={action} 
            onValueChange={onActionChange}
          >
            <SelectTrigger className="w-full border-zinc-700 bg-zinc-800/50 text-zinc-300">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Picked">Picked</SelectItem>
              <SelectItem value="To Order">To Order</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {action === "Picked" && (
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-sm">Pick quantity:</span>
            <Input 
              type="number"
              min="1"
              max={maxQuantity}
              className="w-16 h-8 border-zinc-700 bg-zinc-800/50 text-zinc-300"
              value={pickQuantity}
              onChange={onPickQuantityChange}
              title="How many you are picking now"
            />
            <span className="text-zinc-400 text-sm">
              (max: {maxQuantity})
            </span>
          </div>
        )}
      </div>
      <Button 
        onClick={onSubmit}
        disabled={!action || processing}
        size="sm"
        className="button-primary w-full"
      >
        {processing ? "Saving..." : "Save"}
      </Button>
    </>
  );
};

export default PicklistItemActions;
