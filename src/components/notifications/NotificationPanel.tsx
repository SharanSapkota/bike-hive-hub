import { Check, Clock, Bike, Bell, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

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
  onClose?: () => void;
}

const NotificationPanel = ({ onMarkAsRead, onClose }: NotificationPanelProps) => {
  const [notifications, setNotifications] = useState(mockNotifications);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleApprove = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev =>
      prev.filter(n => n.id !== notificationId)
    );
    toast({
      title: 'Request Approved',
      description: 'The rental request has been approved successfully.',
    });
  };

  const handleReject = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev =>
      prev.filter(n => n.id !== notificationId)
    );
    toast({
      title: 'Request Rejected',
      description: 'The rental request has been rejected.',
      variant: 'destructive',
    });
  };

  const handleViewAll = () => {
    navigate('/rental-requests');
    onClose?.();
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <h3 className="font-semibold text-base">Notifications</h3>
        {notifications.some(n => !n.read) && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-7 px-2 hover:bg-accent/50"
            onClick={onMarkAsRead}
          >
            Mark all read
          </Button>
        )}
      </div>
      
      <ScrollArea className="h-[420px]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground px-4">
            <Bell className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No notifications yet</p>
            <p className="text-xs mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'p-4 hover:bg-accent/30 transition-all cursor-pointer group',
                  !notification.read && 'bg-primary/5 border-l-2 border-l-primary'
                )}
              >
                <div className="flex gap-3">
                  <div className="mt-0.5 p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm leading-tight">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5 animate-pulse" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-snug">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground/80 font-medium">
                      {formatTime(notification.createdAt)}
                    </p>
                    
                    {notification.type === 'rental_request' && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          onClick={(e) => handleApprove(notification.id, e)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1 h-8 text-xs"
                          onClick={(e) => handleReject(notification.id, e)}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <Separator />
      
      <div className="p-2 bg-card">
        <Button 
          variant="ghost" 
          className="w-full text-sm hover:bg-accent/50 text-primary font-medium" 
          size="sm"
          onClick={handleViewAll}
        >
          View all notifications
        </Button>
      </div>
    </div>
  );
};

export default NotificationPanel;
