
import { useState } from 'react';
import { mainMenuItems, MenuItem } from './config/menuItems';
import MenuLink from './items/MenuLink';
import MenuDropdown from './items/MenuDropdown';

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

  const renderMenuItem = (item: MenuItem) => {
    if (item.isDropdown) {
      return (
        <MenuDropdown 
          key={item.path}
          item={item}
          isActive={isActive}
          activeDropdown={activeDropdown}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      );
    }

    // For the Dashboard item, we need to handle the special case
    const isDashboardActive = item.path === '/' 
      ? isActive('/') && !isActive('/admin') && !isActive('/users') && !isActive('/actions')
      : isActive(item.path);

    return (
      <li key={item.path}>
        <MenuLink path={item.path} isActive={isDashboardActive}>
          {item.icon && <item.icon className="h-4 w-4 mr-2" />}
          {item.label}
        </MenuLink>
      </li>
    );
  };

  return (
    <nav className="hidden md:flex justify-center flex-1">
      <ul className="flex space-x-1">
        {mainMenuItems.map(renderMenuItem)}
      </ul>
    </nav>
  );
};

export default DesktopMenu;
