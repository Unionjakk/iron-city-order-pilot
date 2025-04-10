
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MobileMenuItemProps {
  path: string;
  label: string;
  icon?: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

const MobileMenuItem = ({ 
  path, 
  label, 
  icon, 
  isActive, 
  onClick,
  className 
}: MobileMenuItemProps) => {
  return (
    <Link 
      to={path}
      onClick={onClick}
      className={cn(
        "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive
          ? "bg-zinc-800 text-orange-400"
          : "text-zinc-400 hover:bg-zinc-800 hover:text-orange-300",
        className
      )}
    >
      {icon}
      {label}
    </Link>
  );
};

export default MobileMenuItem;
