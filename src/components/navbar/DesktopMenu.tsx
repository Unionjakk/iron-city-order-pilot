
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Users, CheckSquare, List, Clock, ShoppingCart, ChevronDown } from 'lucide-react';

type DesktopMenuProps = {
  isActive: (path: string) => boolean;
};

const DesktopMenu = ({ isActive }: DesktopMenuProps) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const handleMouseEnter = (dropdown: string) => {
    setActiveDropdown(dropdown);
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
  };

  return (
    <nav className="hidden md:flex justify-center flex-1">
      <ul className="flex space-x-1">
        {/* Dashboard Item */}
        <li>
          <Link
            to="/"
            className={cn(
              "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
              isActive('/') && !isActive('/admin') && !isActive('/users') && !isActive('/actions')
                ? "bg-zinc-800 text-orange-400"
                : "text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300"
            )}
          >
            Dashboard
          </Link>
        </li>
        
        {/* Users Item */}
        <li>
          <Link
            to="/users"
            className={cn(
              "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
              isActive('/users')
                ? "bg-zinc-800 text-orange-400"
                : "text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300"
            )}
          >
            <Users className="h-4 w-4 mr-2" />
            Users
          </Link>
        </li>
        
        {/* Actions Dropdown */}
        <li 
          className="relative"
          onMouseEnter={() => handleMouseEnter('actions')}
          onMouseLeave={handleMouseLeave}
        >
          <button
            className={cn(
              "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
              (isActive('/actions') || activeDropdown === 'actions')
                ? "bg-zinc-800 text-orange-400"
                : "text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300"
            )}
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            Actions
            <ChevronDown className="h-4 w-4 ml-1" />
          </button>
          
          {/* Actions Dropdown Menu */}
          <div 
            className={cn(
              "absolute left-0 top-full mt-1 w-48 rounded-md border border-zinc-800 bg-zinc-900 shadow-lg z-50 transition-all",
              activeDropdown === 'actions' ? "opacity-100 visible" : "opacity-0 invisible"
            )}
          >
            <ul className="py-1">
              <li>
                <Link
                  to="/actions/picklist"
                  className={cn(
                    "flex items-center px-4 py-2 text-sm transition-colors",
                    isActive('/actions/picklist')
                      ? "text-orange-400"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-orange-300"
                  )}
                >
                  <List className="h-4 w-4 mr-2" />
                  To Pick
                </Link>
              </li>
              <li>
                <Link
                  to="/actions/toorder"
                  className={cn(
                    "flex items-center px-4 py-2 text-sm transition-colors",
                    isActive('/actions/toorder')
                      ? "text-orange-400"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-orange-300"
                  )}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  To Order
                </Link>
              </li>
              <li>
                <Link
                  to="/actions/backorder"
                  className={cn(
                    "flex items-center px-4 py-2 text-sm transition-colors",
                    isActive('/actions/backorder')
                      ? "text-orange-400"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-orange-300"
                  )}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Backorder
                </Link>
              </li>
            </ul>
          </div>
        </li>
        
        {/* Admin Dropdown */}
        <li 
          className="relative"
          onMouseEnter={() => handleMouseEnter('admin')}
          onMouseLeave={handleMouseLeave}
        >
          <button
            className={cn(
              "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
              (isActive('/admin') || activeDropdown === 'admin')
                ? "bg-zinc-800 text-orange-400"
                : "text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300"
            )}
          >
            Admin
            <ChevronDown className="h-4 w-4 ml-1" />
          </button>
          
          {/* Admin Dropdown Menu */}
          <div 
            className={cn(
              "absolute left-0 top-full mt-1 w-48 rounded-md border border-zinc-800 bg-zinc-900 shadow-lg z-50 transition-all",
              activeDropdown === 'admin' ? "opacity-100 visible" : "opacity-0 invisible"
            )}
          >
            <ul className="py-1">
              <li>
                <Link
                  to="/admin/uploads"
                  className={cn(
                    "flex items-center px-4 py-2 text-sm transition-colors",
                    isActive('/admin/uploads') && !isActive('/admin/uploads/pinnacle') && !isActive('/admin/uploads/harley') && !isActive('/admin/uploads/shopify')
                      ? "text-orange-400"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-orange-300"
                  )}
                >
                  Uploads
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/uploads/pinnacle"
                  className={cn(
                    "flex items-center px-4 py-2 text-sm transition-colors pl-6",
                    isActive('/admin/uploads/pinnacle')
                      ? "text-orange-400"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-orange-300"
                  )}
                >
                  Pinnacle Upload
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/uploads/harley"
                  className={cn(
                    "flex items-center px-4 py-2 text-sm transition-colors pl-6",
                    isActive('/admin/uploads/harley')
                      ? "text-orange-400"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-orange-300"
                  )}
                >
                  Harley Upload
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/uploads/shopify"
                  className={cn(
                    "flex items-center px-4 py-2 text-sm transition-colors pl-6",
                    isActive('/admin/uploads/shopify')
                      ? "text-orange-400"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-orange-300"
                  )}
                >
                  Shopify API
                </Link>
              </li>
            </ul>
          </div>
        </li>
      </ul>
    </nav>
  );
};

export default DesktopMenu;
