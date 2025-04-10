
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { MenuItem } from '../config/menuItems';
import MobileMenuItem from './MobileMenuItem';

interface MobileMenuSectionProps {
  sectionName: string;
  sectionPath: string;
  isActive: (path: string) => boolean;
  onItemClick: () => void;
  icon?: React.ReactNode;
  children: MenuItem[];
}

const MobileMenuSection = ({ 
  sectionName, 
  sectionPath,
  isActive, 
  onItemClick,
  icon,
  children 
}: MobileMenuSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const toggleSection = () => {
    setIsExpanded(prev => !prev);
  };

  return (
    <li>
      <button
        onClick={toggleSection}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium transition-colors",
          (isActive(sectionPath) || isExpanded)
            ? "bg-zinc-800 text-orange-400"
            : "text-zinc-400 hover:bg-zinc-800 hover:text-orange-300"
        )}
      >
        <span className="flex items-center">
          {icon}
          {sectionName}
        </span>
        {isExpanded ? 
          <ChevronUp className="h-4 w-4" /> : 
          <ChevronDown className="h-4 w-4" />
        }
      </button>
      
      {isExpanded && (
        <ul className="mt-1 pl-4 space-y-1">
          <li>
            <MobileMenuItem
              path={sectionPath}
              label={`${sectionName} Dashboard`}
              isActive={isActive(sectionPath) && !children.some(child => isActive(child.path))}
              onClick={onItemClick}
            />
          </li>
          {children.map((child) => (
            <li key={child.path}>
              <MobileMenuItem
                path={child.path}
                label={child.label}
                icon={child.icon && <child.icon className="h-4 w-4 mr-2" />}
                isActive={isActive(child.path)}
                onClick={onItemClick}
                className={child.isSubItem ? "pl-4" : ""}
              />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

export default MobileMenuSection;
