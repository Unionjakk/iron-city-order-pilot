
import { Users, CheckSquare, List, Clock, ShoppingCart, Settings, CheckCircle, Truck, Package, BarChart3, Search, Wrench, Calculator } from 'lucide-react';

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
    path: '/tools',
    label: 'Other Tools',
    icon: Wrench,
    isDropdown: true,
    children: [
      {
        path: '/visualiser',
        label: 'Visualiser',
        icon: BarChart3,
      },
      {
        path: '/order-lookup',
        label: 'Order Lookup',
        icon: Search,
      },
      {
        path: '/accountant-corrections',
        label: 'Accountant Corrections',
        icon: Calculator,
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
