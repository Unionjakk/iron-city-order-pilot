
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

interface MobileMenuToggleProps {
  isOpen: boolean;
  toggleMenu: () => void;
}

const MobileMenuToggle = ({ isOpen, toggleMenu }: MobileMenuToggleProps) => {
  return (
    <Button 
      variant="ghost" 
      size="icon"
      onClick={toggleMenu}
      className="text-orange-400 hover:bg-zinc-800 hover:text-orange-300"
    >
      {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </Button>
  );
};

export default MobileMenuToggle;
