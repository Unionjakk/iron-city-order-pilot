
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface MobileMenuHeaderProps {
  onClose: () => void;
}

const MobileMenuHeader = ({ onClose }: MobileMenuHeaderProps) => {
  return (
    <>
      <div className="p-4 flex justify-between items-center">
        <h2 className="text-orange-400 text-lg font-semibold">Navigation</h2>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onClose}
          className="text-orange-400 hover:bg-zinc-800 hover:text-orange-300"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <Separator className="bg-zinc-800" />
    </>
  );
};

export default MobileMenuHeader;
