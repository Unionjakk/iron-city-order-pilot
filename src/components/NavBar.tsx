
import { useLocation } from 'react-router-dom';
import Logo from './navbar/Logo';
import DesktopMenu from './navbar/DesktopMenu';
import MobileMenu from './navbar/MobileMenu';
import UserMenu from './navbar/UserMenu';

const NavBar = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  return (
    <header className="bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Logo />
        <DesktopMenu isActive={isActive} />
        <MobileMenu isActive={isActive} />
        <UserMenu />
      </div>
    </header>
  );
};

export default NavBar;
