
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MenuItem } from '../config/menuItems';

interface MenuDropdownProps {
  item: MenuItem;
  isActive: (path: string) => boolean;
  activeDropdown: string | null;
  onMouseEnter: (dropdown: string) => void;
  onMouseLeave: () => void;
}

const MenuDropdown = ({ 
  item, 
  isActive, 
  activeDropdown, 
  onMouseEnter, 
  onMouseLeave 
}: MenuDropdownProps) => {
  const isDropdownActive = isActive(item.path) || activeDropdown === item.path;
  
  return (
    <li 
      className="relative"
      onMouseEnter={() => onMouseEnter(item.path)}
      onMouseLeave={onMouseLeave}
    >
      <button
        className={cn(
          "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
          isDropdownActive
            ? "bg-zinc-800 text-orange-400"
            : "text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300"
        )}
      >
        {item.icon && <item.icon className="h-4 w-4 mr-2" />}
        {item.label}
        <ChevronDown className="h-4 w-4 ml-1" />
      </button>
      
      {/* Dropdown Menu */}
      <div 
        className={cn(
          "absolute left-0 top-full mt-1 w-48 rounded-md border border-zinc-800 bg-zinc-900 shadow-lg z-50 transition-all",
          activeDropdown === item.path ? "opacity-100 visible" : "opacity-0 invisible"
        )}
      >
        <ul className="py-1">
          {item.children?.map((child) => (
            <li key={child.path}>
              <Link
                to={child.path}
                className={cn(
                  "flex items-center px-4 py-2 text-sm transition-colors",
                  child.isSubItem && "pl-6",
                  isActive(child.path)
                    ? "text-orange-400"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-orange-300"
                )}
              >
                {child.icon && <child.icon className="h-4 w-4 mr-2" />}
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
};

export default MenuDropdown;
