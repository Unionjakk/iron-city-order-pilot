
import { Users, CheckSquare, List, Clock, ShoppingCart, Settings, CheckCircle, Truck, Package } from 'lucide-react';

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
    path: '/actions',
    label: 'Actions',
    icon: CheckSquare,
    isDropdown: true,
    children: [
      {
        path: '/actions/picklist',
        label: 'To Pick',
        icon: List,
      },
      {
        path: '/actions/picked',
        label: 'Picked',
        icon: CheckCircle,
      },
      {
        path: '/actions/toorder',
        label: 'To Order',
        icon: ShoppingCart,
      },
      {
        path: '/actions/ordered',
        label: 'Ordered',
        icon: Package,
      },
      {
        path: '/actions/dispatch',
        label: 'To Dispatch',
        icon: Truck,
      },
      {
        path: '/actions/backorder',
        label: 'Backorder',
        icon: Clock,
      },
      {
        path: '/actions/backorder-report',
        label: 'Backorder Report',
        icon: Package,
      },
    ],
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
