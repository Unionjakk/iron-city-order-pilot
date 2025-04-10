
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

const NavBar = () => {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };
  
  return (
    <header className="bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link to="/" className="text-xl font-bold text-orange-500">Iron City Shopify</Link>
        </div>
        
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={cn(
                  "inline-flex h-9 px-4 py-2 items-center justify-center rounded-md text-sm font-medium transition-colors",
                  isActive('/') && !isActive('/admin') ? "bg-zinc-800 text-orange-400" : "text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300"
                )}
              >
                <Link to="/">Dashboard</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <NavigationMenuTrigger className={cn(
                isActive('/admin') ? "bg-zinc-800 text-orange-400" : "text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300"
              )}>
                Admin
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[200px] gap-2 p-2 bg-zinc-900 border border-zinc-800">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/admin"
                        className={cn(
                          "block select-none space-y-1 rounded-md p-3 hover:bg-zinc-800/70 hover:text-orange-300",
                          isActive('/admin') && !isActive('/admin/uploads') ? "bg-zinc-800 text-orange-400" : "text-zinc-400"
                        )}
                      >
                        <div className="text-sm font-medium">Admin Dashboard</div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/admin/uploads"
                        className={cn(
                          "block select-none space-y-1 rounded-md p-3 hover:bg-zinc-800/70 hover:text-orange-300",
                          isActive('/admin/uploads') ? "bg-zinc-800 text-orange-400" : "text-zinc-400"
                        )}
                      >
                        <div className="text-sm font-medium">Uploads</div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/admin/uploads/pinnacle"
                        className={cn(
                          "block select-none space-y-1 rounded-md p-3 pl-6 hover:bg-zinc-800/70 hover:text-orange-300",
                          isActive('/admin/uploads/pinnacle') ? "bg-zinc-800 text-orange-400" : "text-zinc-400"
                        )}
                      >
                        <div className="text-sm font-medium">Pinnacle Upload</div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/admin/uploads/harley"
                        className={cn(
                          "block select-none space-y-1 rounded-md p-3 pl-6 hover:bg-zinc-800/70 hover:text-orange-300",
                          isActive('/admin/uploads/harley') ? "bg-zinc-800 text-orange-400" : "text-zinc-400"
                        )}
                      >
                        <div className="text-sm font-medium">Harley Upload</div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/admin/uploads/shopify"
                        className={cn(
                          "block select-none space-y-1 rounded-md p-3 pl-6 hover:bg-zinc-800/70 hover:text-orange-300",
                          isActive('/admin/uploads/shopify') ? "bg-zinc-800 text-orange-400" : "text-zinc-400"
                        )}
                      >
                        <div className="text-sm font-medium">Shopify API</div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        
        {/* Mobile menu */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-orange-400 hover:bg-zinc-800 hover:text-orange-300"
              >
                Menu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
              <DropdownMenuLabel className="text-orange-400">Navigation</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem asChild>
                <Link 
                  to="/" 
                  className={cn(
                    "cursor-pointer",
                    isActive('/') && !isActive('/admin') ? "text-orange-400" : "text-zinc-400 hover:text-orange-300"
                  )}
                >
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuLabel className="text-orange-400 pt-2">Admin</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem asChild>
                <Link 
                  to="/admin" 
                  className={cn(
                    "cursor-pointer",
                    isActive('/admin') && !isActive('/admin/uploads') ? "text-orange-400" : "text-zinc-400 hover:text-orange-300"
                  )}
                >
                  Admin Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link 
                  to="/admin/uploads" 
                  className={cn(
                    "cursor-pointer",
                    isActive('/admin/uploads') && !isActive('/admin/uploads/pinnacle') && !isActive('/admin/uploads/harley') && !isActive('/admin/uploads/shopify') ? "text-orange-400" : "text-zinc-400 hover:text-orange-300"
                  )}
                >
                  Uploads
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link 
                  to="/admin/uploads/pinnacle" 
                  className={cn(
                    "cursor-pointer pl-6",
                    isActive('/admin/uploads/pinnacle') ? "text-orange-400" : "text-zinc-400 hover:text-orange-300"
                  )}
                >
                  Pinnacle Upload
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link 
                  to="/admin/uploads/harley" 
                  className={cn(
                    "cursor-pointer pl-6",
                    isActive('/admin/uploads/harley') ? "text-orange-400" : "text-zinc-400 hover:text-orange-300"
                  )}
                >
                  Harley Upload
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link 
                  to="/admin/uploads/shopify" 
                  className={cn(
                    "cursor-pointer pl-6",
                    isActive('/admin/uploads/shopify') ? "text-orange-400" : "text-zinc-400 hover:text-orange-300"
                  )}
                >
                  Shopify API
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="hidden md:flex items-center space-x-4">
          <span className="text-sm text-orange-300">
            Welcome, {user?.user_metadata.full_name || 'Admin'}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSignOut} 
            className="border-zinc-700 text-orange-400 hover:bg-zinc-800 hover:text-orange-300"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
