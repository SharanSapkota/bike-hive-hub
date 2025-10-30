import { Check, Clock, Bike, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'rental_request' | 'rental_approved' | 'rental_rejected';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

// Mock data - replace with real data from your backend
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'rental_request',
    title: 'New Rental Request',
    message: 'John Doe requested to rent your Mountain Bike',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    id: '2',
    type: 'rental_request',
    title: 'New Rental Request',
    message: 'Sarah Smith requested to rent your Road Bike',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: '3',
    type: 'rental_request',
    title: 'New Rental Request',
    message: 'Mike Johnson requested to rent your City Bike',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60),
  },
];

const getIcon = (type: Notification['type']) => {
  switch (type) {
    case 'rental_request':
      return <Bike className="h-4 w-4 text-primary" />;
    case 'rental_approved':
      return <Check className="h-4 w-4 text-green-500" />;
    case 'rental_rejected':
      return <Clock className="h-4 w-4 text-destructive" />;
  }
};

const formatTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 1000 / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

interface NotificationPanelProps {
  onMarkAsRead?: () => void;
}

const NotificationPanel = ({ onMarkAsRead }: NotificationPanelProps) => {
  const notifications = mockNotifications; // Replace with real data

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Notifications</h3>
        {notifications.some(n => !n.read) && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs"
            onClick={onMarkAsRead}
          >
            Mark all as read
          </Button>
        )}
      </div>
      
      <ScrollArea className="h-[400px]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Bell className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'p-4 hover:bg-accent/50 transition-colors cursor-pointer',
                  !notification.read && 'bg-accent/30'
                )}
              >
                <div className="flex gap-3">
                  <div className="mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm leading-tight">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-tight">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <Separator />
      
      <div className="p-2">
        <Button variant="ghost" className="w-full text-sm" size="sm">
          View all notifications
        </Button>
      </div>
    </div>
  );
};

export default NotificationPanel;
