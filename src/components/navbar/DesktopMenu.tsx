
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';
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
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink
            asChild
            className={cn(
              "inline-flex h-9 px-4 py-2 items-center justify-center rounded-md text-sm font-medium transition-colors",
              isActive('/') && !isActive('/admin') && !isActive('/users') ? "bg-zinc-800 text-orange-400" : "text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300"
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
          <Link to="/admin">
            <NavigationMenuTrigger className={cn(
              isActive('/admin') ? "bg-zinc-800 text-orange-400" : "text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300"
            )}>
              Admin
            </NavigationMenuTrigger>
          </Link>
          <NavigationMenuContent className="bg-zinc-900 border border-zinc-800 z-50">
            <ul className="grid w-[200px] gap-2 p-2">
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
  );
};

export default DesktopMenu;
