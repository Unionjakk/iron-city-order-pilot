
import { Users, Settings } from 'lucide-react';

export interface MenuItem {
  path: string;
  label: string;
  icon?: React.ElementType;
  isDropdown?: boolean;
  children?: MenuItem[];
  isSubItem?: boolean;
}

export const mainMenuItems: MenuItem[] = [
  {
    path: '/',
    label: 'Dashboard',
  },
  {
    path: '/users',
    label: 'Users',
    icon: Users,
  },
  {
    path: '/admin',
    label: 'Admin',
    isDropdown: true,
    children: [
      {
        path: '/admin/uploads',
        label: 'Uploads',
      },
      {
        path: '/admin/uploads/pinnacle',
        label: 'Pinnacle Upload',
        isSubItem: true,
      },
      {
        path: '/admin/uploads/harley',
        label: 'Harley Upload',
        isSubItem: true,
      },
      {
        path: '/admin/uploads/shopify',
        label: 'Shopify API',
        isSubItem: true,
      },
      {
        path: '/admin/settings',
        label: 'Settings',
        icon: Settings,
      },
    ],
  },
];
