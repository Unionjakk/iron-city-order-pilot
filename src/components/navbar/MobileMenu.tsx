
import { useState } from 'react';
import MobileMenuToggle from './items/MobileMenuToggle';
import MobileMenuOverlay from './items/MobileMenuOverlay';
import MobileMenuContent from './items/MobileMenuContent';

type MobileMenuProps = {
  isActive: (path: string) => boolean;
};

const MobileMenu = ({ isActive }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <div className="md:hidden relative">
      <MobileMenuToggle isOpen={isOpen} toggleMenu={toggleMenu} />
      <MobileMenuOverlay isOpen={isOpen} onClose={closeMenu} />
      <MobileMenuContent isOpen={isOpen} onClose={closeMenu} isActive={isActive} />
    </div>
  );
};

export default MobileMenu;
