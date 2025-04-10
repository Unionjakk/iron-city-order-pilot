
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Info } from 'lucide-react';

const PinnacleFormatHelp = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Info className="mr-2 h-4 w-4" />
          View Excel Format
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[90%] sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-orange-500">Required Excel Format</SheetTitle>
          <SheetDescription className="text-zinc-400">
            Your Pinnacle export should match this format
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <img 
            src="/lovable-uploads/90c8196f-a4b3-40ed-a9d0-fede7295585c.png" 
            alt="Pinnacle Excel Format Example" 
            className="max-w-full h-auto rounded-lg border border-zinc-700" 
          />
          <div className="mt-4 p-3 bg-zinc-800 rounded border border-zinc-700">
            <h4 className="text-orange-400 font-medium text-sm mb-2">Required Columns</h4>
            <ul className="list-disc pl-5 text-sm text-zinc-300 space-y-1">
              <li>Part No - Unique identifier for the part</li>
              <li>Prod Group / Product Group - Product category classification</li>
              <li>Description - Part description text</li>
              <li>Bin Locations / Bin Location 1 - Storage location</li>
              <li>Stock / Stock Holding - Quantity currently in stock</li>
              <li>Av Cost - Average cost per unit</li>
              <li>Tot Av Cost / Total Av Cost - Total average cost</li>
              <li>Cost - Current cost per unit</li>
              <li>Tot Cost / Total Cost - Total current cost</li>
              <li>Retail - Retail price per unit</li>
              <li>Tot Retail / Total Retail - Total retail value</li>
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PinnacleFormatHelp;
