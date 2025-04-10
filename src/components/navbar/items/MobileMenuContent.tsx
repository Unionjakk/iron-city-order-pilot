
import { cn } from '@/lib/utils';
import { mainMenuItems } from '../config/menuItems';
import MobileMenuHeader from './MobileMenuHeader';
import MobileMenuItem from './MobileMenuItem';
import MobileMenuSection from './MobileMenuSection';
import { Users, CheckSquare, List, Clock, ShoppingCart } from 'lucide-react';

interface MobileMenuContentProps {
  isOpen: boolean;
  onClose: () => void;
  isActive: (path: string) => boolean;
}

const MobileMenuContent = ({ isOpen, onClose, isActive }: MobileMenuContentProps) => {
  return (
    <div 
      className={cn(
        "fixed top-0 right-0 h-full w-64 bg-zinc-900 z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <MobileMenuHeader onClose={onClose} />
      
      <nav className="p-2">
        <ul className="space-y-1">
          {/* Dashboard Item */}
          <li>
            <MobileMenuItem 
              path="/"
              label="Dashboard"
              isActive={isActive('/') && !isActive('/admin') && !isActive('/users') && !isActive('/actions')}
              onClick={onClose}
            />
          </li>
          
          {/* Users Item */}
          <li>
            <MobileMenuItem 
              path="/users"
              label="Users"
              icon={<Users className="h-4 w-4 mr-2" />}
              isActive={isActive('/users')}
              onClick={onClose}
            />
          </li>
          
          {/* Actions Section */}
          <MobileMenuSection
            sectionName="Actions"
            sectionPath="/actions"
            isActive={isActive}
            onItemClick={onClose}
            icon={<CheckSquare className="h-4 w-4 mr-2" />}
            children={mainMenuItems.find(item => item.path === '/actions')?.children || []}
          />
          
          {/* Admin Section */}
          <MobileMenuSection
            sectionName="Admin"
            sectionPath="/admin"
            isActive={isActive}
            onItemClick={onClose}
            children={mainMenuItems.find(item => item.path === '/admin')?.children || []}
          />
        </ul>
      </nav>
    </div>
  );
};

export default MobileMenuContent;
