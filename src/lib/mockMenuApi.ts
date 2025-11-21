import {
  Map,
  LayoutDashboard,
  User,
  History,
  Bike,
  Users,
  Settings,
  Package,
  Bell,
  List,
} from 'lucide-react';
import { UserRole } from '@/contexts/AuthContext';

export interface MenuItem {
  icon: any;
  label: string;
  path: string;
}

// Mock API function to fetch menu items based on user role
export const fetchMenuItems = (role: UserRole): MenuItem[] => {
  role = role.toLowerCase() as UserRole;
  // Simulate API delay

  const menuData: Record<UserRole, MenuItem[]> = {
    renter: [
      { icon: List, label: 'Gear List', path: '/renter/gear-list' },
      { icon: Map, label: 'Map View', path: '/map' },
      { icon: Bell, label: 'Notifications', path: '/notifications' },
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: History, label: 'Rental History', path: '/history' },
      { icon: User, label: 'Profile', path: '/profile' },
    ],
    owner: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Bell, label: 'Notifications', path: '/notifications' },
      { icon: Bike, label: 'My Bikes', path: '/bikes' },
      { icon: Package, label: 'Rentals', path: '/rentals' },
      { icon: User, label: 'Profile', path: '/profile' },
    ],
    admin: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Users, label: 'Users', path: '/users' },
      { icon: Bike, label: 'Bikes', path: '/bikes' },
      { icon: Package, label: 'Categories', path: '/categories' },
      { icon: Settings, label: 'Settings', path: '/settings' },
    ],
  };

  return menuData[role] || menuData.renter;
};
