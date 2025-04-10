
import { cn } from '@/lib/utils';

interface MobileMenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenuOverlay = ({ isOpen, onClose }: MobileMenuOverlayProps) => {
  return (
    <div 
      className={cn(
        "fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      onClick={onClose}
    />
  );
};

export default MobileMenuOverlay;
