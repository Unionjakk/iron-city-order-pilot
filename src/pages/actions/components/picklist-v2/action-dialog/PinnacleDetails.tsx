
import React from 'react';
import PinnacleLogo from '../PinnacleLogo';

interface PinnacleDetailsProps {
  stockQuantity: number | null;
  totalPickedForOthers: number;
  description: string | null;
  binLocation: string | null;
  cost: number | null;
}

const PinnacleDetails = ({ 
  stockQuantity, 
  totalPickedForOthers,
  description, 
  binLocation, 
  cost 
}: PinnacleDetailsProps) => {
  const formatCurrency = (value: number | null) => {
    if (value === null) return "N/A";
    return `£${value.toFixed(2)}`;
  };

  return (
    <div className="bg-zinc-800/30 p-4 rounded-md">
      <div className="flex justify-center mb-4">
        <PinnacleLogo className="h-8 w-auto" />
      </div>
      <div className="space-y-3">
        <div>
          <span className="text-green-500 font-medium">Stock:</span>
          <span className="text-zinc-300 ml-2">
            {stockQuantity !== null ? stockQuantity : "N/A"}
            <span className="text-zinc-500 text-sm ml-2">
              ({totalPickedForOthers > 0 ? `${totalPickedForOthers} picked for other orders` : "none picked"})
            </span>
          </span>
        </div>
        <div>
          <span className="text-green-500 font-medium">Description:</span>
          <div className="text-zinc-300 mt-1">{description || "N/A"}</div>
        </div>
        <div>
          <span className="text-green-500 font-medium">Location:</span>
          <span className="text-zinc-300 ml-2">{binLocation || "N/A"}</span>
        </div>
        <div>
          <span className="text-green-500 font-medium">Cost:</span>
          <span className="text-zinc-300 ml-2">{formatCurrency(cost)}</span>
        </div>
      </div>
    </div>
  );
};

export default PinnacleDetails;
