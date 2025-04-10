
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Users, CheckSquare, List, Clock, ShoppingCart } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

type DesktopMenuProps = {
  isActive: (path: string) => boolean;
};

const DesktopMenu = ({ isActive }: DesktopMenuProps) => {
  return (
    <NavigationMenu className="hidden md:flex ml-6">
      <NavigationMenuList className="gap-1">
        <NavigationMenuItem>
          <NavigationMenuLink
            asChild
            className={cn(
              "inline-flex h-9 px-4 py-2 items-center justify-center rounded-md text-sm font-medium transition-colors",
              isActive('/') && !isActive('/admin') && !isActive('/users') && !isActive('/actions') ? "bg-zinc-800 text-orange-400" : "text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300"
            )}
          >
            <Link to="/">Dashboard</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <NavigationMenuLink
            asChild
            className={cn(
              "inline-flex h-9 px-4 py-2 items-center justify-center rounded-md text-sm font-medium transition-colors",
              isActive('/users') ? "bg-zinc-800 text-orange-400" : "text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300"
            )}
          >
            <Link to="/users">
              <Users className="h-4 w-4 mr-2 inline" />
              Users
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <NavigationMenuTrigger className={cn(
            "h-9 px-4 py-2 text-sm",
            isActive('/actions') ? "bg-zinc-800 text-orange-400" : "text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300"
          )}>
            <CheckSquare className="h-4 w-4 mr-2 inline" />
            Actions
          </NavigationMenuTrigger>
          <NavigationMenuContent className="bg-zinc-900 border border-zinc-800">
            <ul className="grid w-[200px] gap-1 p-2">
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    to="/actions"
                    className={cn(
                      "block select-none rounded-md p-2 hover:bg-zinc-800/70 hover:text-orange-300",
                      isActive('/actions') && !isActive('/actions/picklist') && !isActive('/actions/toorder') && !isActive('/actions/backorder') ? "bg-zinc-800 text-orange-400" : "text-zinc-400"
                    )}
                  >
                    <div className="text-sm font-medium">Actions Dashboard</div>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    to="/actions/picklist"
                    className={cn(
                      "block select-none rounded-md p-2 hover:bg-zinc-800/70 hover:text-orange-300",
                      isActive('/actions/picklist') ? "bg-zinc-800 text-orange-400" : "text-zinc-400"
                    )}
                  >
                    <div className="flex items-center">
                      <List className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">To Pick</span>
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    to="/actions/toorder"
                    className={cn(
                      "block select-none rounded-md p-2 hover:bg-zinc-800/70 hover:text-orange-300",
                      isActive('/actions/toorder') ? "bg-zinc-800 text-orange-400" : "text-zinc-400"
                    )}
                  >
                    <div className="flex items-center">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">To Order</span>
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    to="/actions/backorder"
                    className={cn(
                      "block select-none rounded-md p-2 hover:bg-zinc-800/70 hover:text-orange-300",
                      isActive('/actions/backorder') ? "bg-zinc-800 text-orange-400" : "text-zinc-400"
                    )}
                  >
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">Backorder</span>
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <NavigationMenuTrigger className={cn(
            "h-9 px-4 py-2 text-sm",
            isActive('/admin') ? "bg-zinc-800 text-orange-400" : "text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300"
          )}>
            Admin
          </NavigationMenuTrigger>
          <NavigationMenuContent className="bg-zinc-900 border border-zinc-800">
            <ul className="grid w-[200px] gap-1 p-2">
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    to="/admin"
                    className={cn(
                      "block select-none rounded-md p-2 hover:bg-zinc-800/70 hover:text-orange-300",
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
                      "block select-none rounded-md p-2 hover:bg-zinc-800/70 hover:text-orange-300",
                      isActive('/admin/uploads') && !isActive('/admin/uploads/pinnacle') && !isActive('/admin/uploads/harley') && !isActive('/admin/uploads/shopify') ? "bg-zinc-800 text-orange-400" : "text-zinc-400"
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
                      "block select-none rounded-md p-2 pl-6 hover:bg-zinc-800/70 hover:text-orange-300",
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
                      "block select-none rounded-md p-2 pl-6 hover:bg-zinc-800/70 hover:text-orange-300",
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
                      "block select-none rounded-md p-2 pl-6 hover:bg-zinc-800/70 hover:text-orange-300",
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
  );
};

export default DesktopMenu;
