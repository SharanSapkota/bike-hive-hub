import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LogOut,
  Menu,
  X,
  Bike,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { fetchMenuItems, MenuItem } from '@/lib/mockMenuApi';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useNotificationContext } from '@/contexts/NotificationContext';

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const { unreadCount } = useNotificationContext();

  useEffect(() => {
    if(!user) {
      navigate("/login");
      return;
    }
    const loadMenuItems = async () => {
      if (user?.role) {
        const items = await fetchMenuItems(user.role);
        setMenuItems(items);
      }
    };

    loadMenuItems();
  }, [user?.role]);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card shadow-lg"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen bg-sidebar border-r border-sidebar-border z-40 transition-transform duration-300',
          'w-64 flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                {/* <Bike className="h-6 w-6 text-white" /> */}
                <img src="/gearquest.png" alt="Gear Quest" className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">GearQuest</h1>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
            </div>
            <NotificationBell />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const showBadge =
                item.path === '/notifications' && unreadCount > 0;
              const badgeValue =
                unreadCount > 99 ? '99+' : unreadCount.toString();

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                          : 'hover:bg-sidebar-accent/50 text-sidebar-foreground'
                      )
                    }
                  >
                    <div className="relative">
                      <item.icon className="h-5 w-5" />
                      {showBadge && (
                        <span className="absolute -top-1 -right-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground shadow">
                          {badgeValue} 
                        </span>
                      )}
                    </div>
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent/30 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-medium">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            className="w-full justify-start gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
