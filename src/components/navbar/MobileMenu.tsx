
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Users, CheckSquare, List, Clock, ShoppingCart } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type MobileMenuProps = {
  isActive: (path: string) => boolean;
};

const MobileMenu = ({ isActive }: MobileMenuProps) => {
  return (
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
        <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800 z-50">
          <DropdownMenuLabel className="text-orange-400">Navigation</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuItem asChild>
            <Link 
              to="/" 
              className={cn(
                "cursor-pointer",
                isActive('/') && !isActive('/admin') && !isActive('/users') && !isActive('/actions') ? "text-orange-400" : "text-zinc-400 hover:text-orange-300"
              )}
            >
              Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link 
              to="/users" 
              className={cn(
                "cursor-pointer flex items-center",
                isActive('/users') ? "text-orange-400" : "text-zinc-400 hover:text-orange-300"
              )}
            >
              <Users className="h-4 w-4 mr-2" />
              Users
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link 
              to="/actions" 
              className={cn(
                "cursor-pointer flex items-center",
                isActive('/actions') && !isActive('/actions/picklist') && !isActive('/actions/toorder') && !isActive('/actions/backorder') ? "text-orange-400" : "text-zinc-400 hover:text-orange-300"
              )}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Actions
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link 
              to="/actions/picklist" 
              className={cn(
                "cursor-pointer flex items-center pl-6",
                isActive('/actions/picklist') ? "text-orange-400" : "text-zinc-400 hover:text-orange-300"
              )}
            >
              <List className="h-4 w-4 mr-2" />
              To Pick
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link 
              to="/actions/toorder" 
              className={cn(
                "cursor-pointer flex items-center pl-6",
                isActive('/actions/toorder') ? "text-orange-400" : "text-zinc-400 hover:text-orange-300"
              )}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              To Order
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link 
              to="/actions/backorder" 
              className={cn(
                "cursor-pointer flex items-center pl-6",
                isActive('/actions/backorder') ? "text-orange-400" : "text-zinc-400 hover:text-orange-300"
              )}
            >
              <Clock className="h-4 w-4 mr-2" />
              Backorder
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link 
              to="/admin" 
              className={cn(
                "cursor-pointer",
                isActive('/admin') && !isActive('/admin/uploads') ? "text-orange-400" : "text-zinc-400 hover:text-orange-300"
              )}
            >
              Admin
            </Link>
          </DropdownMenuItem>
          <DropdownMenuLabel className="text-orange-400 pt-2">Admin</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-zinc-800" />
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
  );
};

export default MobileMenu;
