import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { BookingProvider } from '@/contexts/BookingContext';

const DashboardLayout = () => {
  const { user } = useAuth();
  const showNotifications = user?.role === 'owner' || user?.role === 'admin';

  return (
    <NotificationProvider>
      <BookingProvider user={user}>
        <div className="flex min-h-screen w-full bg-background">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            {showNotifications && (
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 md:px-6 lg:px-8 h-16 flex items-center justify-end shadow-sm">
                <NotificationBell />
              </div>
            )}
            <div className="container max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
              <Outlet />
            </div>
          </main>
        </div>
      </BookingProvider>
    </NotificationProvider>
  );
};

export default DashboardLayout;
