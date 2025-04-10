
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MenuLinkProps {
  path: string;
  isActive: boolean;
  children: React.ReactNode;
}

const MenuLink = ({ path, isActive, children }: MenuLinkProps) => {
  return (
    <Link
      to={path}
      className={cn(
        "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
        isActive
          ? "bg-zinc-800 text-orange-400"
          : "text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300"
      )}
    >
      {children}
    </Link>
  );
};

export default MenuLink;
