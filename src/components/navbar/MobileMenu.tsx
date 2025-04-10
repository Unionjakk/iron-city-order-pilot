
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Users, CheckSquare, List, Clock, ShoppingCart, Menu, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

type MobileMenuProps = {
  isActive: (path: string) => boolean;
};

const MobileMenu = ({ isActive }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleMenu = () => setIsOpen(!isOpen);
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isSectionExpanded = (section: string) => expandedSections.includes(section);

  return (
    <div className="md:hidden relative">
      <Button 
        variant="ghost" 
        size="icon"
        onClick={toggleMenu}
        className="text-orange-400 hover:bg-zinc-800 hover:text-orange-300"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
      
      {/* Mobile Menu Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={toggleMenu}
      />
      
      {/* Mobile Menu Content */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-full w-64 bg-zinc-900 z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-4 flex justify-between items-center">
          <h2 className="text-orange-400 text-lg font-semibold">Navigation</h2>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleMenu}
            className="text-orange-400 hover:bg-zinc-800 hover:text-orange-300"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <Separator className="bg-zinc-800" />
        
        <nav className="p-2">
          <ul className="space-y-1">
            <li>
              <Link 
                to="/"
                onClick={toggleMenu}
                className={cn(
                  "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive('/') && !isActive('/admin') && !isActive('/users') && !isActive('/actions')
                    ? "bg-zinc-800 text-orange-400"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-orange-300"
                )}
              >
                Dashboard
              </Link>
            </li>
            
            <li>
              <Link 
                to="/users"
                onClick={toggleMenu}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive('/users')
                    ? "bg-zinc-800 text-orange-400"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-orange-300"
                )}
              >
                <Users className="h-4 w-4 mr-2" />
                Users
              </Link>
            </li>
            
            {/* Actions Section */}
            <li>
              <button
                onClick={() => toggleSection('actions')}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  (isActive('/actions') || isSectionExpanded('actions'))
                    ? "bg-zinc-800 text-orange-400"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-orange-300"
                )}
              >
                <span className="flex items-center">
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Actions
                </span>
                {isSectionExpanded('actions') ? 
                  <ChevronUp className="h-4 w-4" /> : 
                  <ChevronDown className="h-4 w-4" />
                }
              </button>
              
              {isSectionExpanded('actions') && (
                <ul className="mt-1 pl-4 space-y-1">
                  <li>
                    <Link
                      to="/actions"
                      onClick={toggleMenu}
                      className={cn(
                        "block px-3 py-2 rounded-md text-sm transition-colors",
                        isActive('/actions') && !isActive('/actions/picklist') && !isActive('/actions/toorder') && !isActive('/actions/backorder')
                          ? "text-orange-400"
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-orange-300"
                      )}
                    >
                      Actions Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/actions/picklist"
                      onClick={toggleMenu}
                      className={cn(
                        "flex items-center px-3 py-2 rounded-md text-sm transition-colors",
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
                      onClick={toggleMenu}
                      className={cn(
                        "flex items-center px-3 py-2 rounded-md text-sm transition-colors",
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
                      onClick={toggleMenu}
                      className={cn(
                        "flex items-center px-3 py-2 rounded-md text-sm transition-colors",
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
              )}
            </li>
            
            {/* Admin Section */}
            <li>
              <button
                onClick={() => toggleSection('admin')}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  (isActive('/admin') || isSectionExpanded('admin'))
                    ? "bg-zinc-800 text-orange-400"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-orange-300"
                )}
              >
                <span>Admin</span>
                {isSectionExpanded('admin') ? 
                  <ChevronUp className="h-4 w-4" /> : 
                  <ChevronDown className="h-4 w-4" />
                }
              </button>
              
              {isSectionExpanded('admin') && (
                <ul className="mt-1 pl-4 space-y-1">
                  <li>
                    <Link
                      to="/admin"
                      onClick={toggleMenu}
                      className={cn(
                        "block px-3 py-2 rounded-md text-sm transition-colors",
                        isActive('/admin') && !isActive('/admin/uploads')
                          ? "text-orange-400"
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-orange-300"
                      )}
                    >
                      Admin Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin/uploads"
                      onClick={toggleMenu}
                      className={cn(
                        "block px-3 py-2 rounded-md text-sm transition-colors",
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
                      onClick={toggleMenu}
                      className={cn(
                        "block px-3 py-2 rounded-md text-sm transition-colors pl-4",
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
                      onClick={toggleMenu}
                      className={cn(
                        "block px-3 py-2 rounded-md text-sm transition-colors pl-4",
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
                      onClick={toggleMenu}
                      className={cn(
                        "block px-3 py-2 rounded-md text-sm transition-colors pl-4",
                        isActive('/admin/uploads/shopify')
                          ? "text-orange-400"
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-orange-300"
                      )}
                    >
                      Shopify API
                    </Link>
                  </li>
                </ul>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default MobileMenu;
