import { Check, Clock, Bike, Bell, CheckCircle, XCircle, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnerNotifications } from '@/hooks/useOwnerNotifications';

interface Notification {
  id: string;
  type: 'rental_request' | 'rental_approved' | 'rental_rejected' | 'rental_cancelled' | 'payment' | 'ride_completed';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  bikeId?: string;
  bookingId?: string;
  status?: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed' | 'disputed';
}

// Mock API call
const mockApiCall = (action: 'approve' | 'reject' | 'confirm_complete' | 'dispute_complete'): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 1500); // 1.5 second delay
  });
};

// Mock data - replace with real data from your backend
const getMockNotifications = (role: string): Notification[] => {
  if (role === 'renter') {
    return [
      {
        id: '1',
        type: 'rental_approved',
        title: 'Request Accepted',
        message: 'Your rental request for Mountain Explorer Pro has been accepted',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 5),
        bikeId: '1',
        bookingId: 'booking-1',
      },
      {
        id: '2',
        type: 'rental_rejected',
        title: 'Request Rejected',
        message: 'Your rental request for City Cruiser Deluxe was rejected',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
        bikeId: '2',
      },
      {
        id: '3',
        type: 'rental_approved',
        title: 'Request Accepted',
        message: 'Your rental request for Road Racer Speed has been accepted',
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60),
        bikeId: '3',
        bookingId: 'booking-3',
      },
      {
        id: '4',
        type: 'payment',
        title: 'Payment Successful',
        message: 'Your payment of $150 for Mountain Explorer Pro has been processed',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 90),
        bookingId: 'booking-1',
      },
      {
        id: '5',
        type: 'payment',
        title: 'Payment Pending',
        message: 'Your payment for City Cruiser is being processed',
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 120),
        bookingId: 'booking-2',
      },
      {
        id: '6',
        type: 'ride_completed',
        title: 'Ride Completed',
        message: 'The ride for Mountain Explorer Pro has been completed. Please confirm.',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 15),
        bikeId: '1',
        bookingId: 'booking-1',
        status: 'pending',
      },
    ];
  } else {
    // Owner notifications
    return [
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
      {
        id: '4',
        type: 'payment',
        title: 'Payment Received',
        message: 'You received $150 from John Doe for Mountain Bike rental',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 90),
        bookingId: 'booking-1',
      },
      {
        id: '5',
        type: 'payment',
        title: 'Payment Received',
        message: 'You received $120 from Sarah Smith for Road Bike rental',
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 120),
        bookingId: 'booking-2',
      },
      {
        id: '6',
        type: 'ride_completed',
        title: 'Ride Completed',
        message: 'The ride for Mountain Bike has been completed by John Doe. Please confirm.',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 15),
        bikeId: '1',
        bookingId: 'booking-1',
        status: 'pending',
      },
    ];
  }
};

const getIcon = (type: Notification['type']) => {
  switch (type) {
    case 'rental_request':
      return <Bike className="h-4 w-4 text-primary" />;
    case 'rental_approved':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'rental_rejected':
    case 'rental_cancelled':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'payment':
      return <CreditCard className="h-4 w-4 text-blue-500" />;
    case 'ride_completed':
      return <CheckCircle className="h-4 w-4 text-orange-500" />;
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
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';
  const {
    notifications: socketNotifications,
    markAsRead: markSocketNotificationAsRead,
  } = useOwnerNotifications();
  const [notifications, setNotifications] = useState<Notification[]>(
    getMockNotifications(user?.role || 'renter')
  );
  const [loadingNotifications, setLoadingNotifications] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'requests' | 'payments'>('requests');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isOwner) {
      return;
    }

    if (!socketNotifications.length) {
      return;
    }

    setNotifications((prev) => {
      const entryMap = new Map(prev.map((notification) => [notification.id, notification]));
      const mapped = socketNotifications.map<Notification>((notification) => ({
        id: notification.id,
        type: (notification.type as Notification['type']) ?? 'rental_request',
        title: notification.title,
        message: notification.message,
        read: notification.read,
        createdAt: new Date(notification.createdAt),
        bikeId: notification.data?.bikeId,
        bookingId: notification.data?.bookingId,
        status: notification.data?.status,
      }));

      mapped.forEach((notification) => {
        if (entryMap.has(notification.id)) {
          const existing = entryMap.get(notification.id)!;
          entryMap.set(notification.id, {
            ...existing,
            ...notification,
            createdAt: existing.createdAt || notification.createdAt,
          });
        } else {
          entryMap.set(notification.id, notification);
        }
      });

      return Array.from(entryMap.values()).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    });
  }, [isOwner, socketNotifications]);

  // Show toast notifications for renters when they receive approved/rejected notifications
  useEffect(() => {
    if (user?.role === 'renter') {
      notifications.forEach(notification => {
        if (!notification.read) {
          if (notification.type === 'rental_approved') {
            toast({
              title: "🎉 Booking Accepted!",
              description: notification.message,
              duration: 5000,
            });
          } else if (notification.type === 'rental_rejected') {
            toast({
              title: "❌ Booking Rejected",
              description: notification.message,
              variant: "destructive",
              duration: 5000,
            });
          }
        }
      });
    }
  }, [notifications, user?.role, toast]);

  // Filter notifications based on active tab
  const getFilteredNotifications = () => {
    if (activeTab === 'requests') {
      return notifications.filter(n => 
        n.type === 'rental_request' || 
        n.type === 'rental_approved' || 
        n.type === 'rental_rejected' ||
        n.type === 'rental_cancelled' ||
        n.type === 'ride_completed'
      );
    } else {
      return notifications.filter(n => n.type === 'payment');
    }
  };

  const filteredNotifications = getFilteredNotifications();

  const handleApprove = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Set loading state
    setLoadingNotifications(prev => new Set([...prev, notificationId]));
    
    try {
      // Call mock API
      await mockApiCall('approve');
      
      // Update notification status
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, type: 'rental_approved' as const, title: 'Request Accepted', status: 'accepted' }
            : n
        )
      );
      
      toast({
        title: 'Request Approved',
        description: 'The rental request has been approved successfully.',
      });
    } finally {
      // Clear loading state
      setLoadingNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const handleReject = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Set loading state
    setLoadingNotifications(prev => new Set([...prev, notificationId]));
    
    try {
      // Call mock API
      await mockApiCall('reject');
      
      // Update notification status
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, type: 'rental_rejected' as const, title: 'Request Rejected', status: 'rejected' }
            : n
        )
      );
      
      toast({
        title: 'Request Rejected',
        description: 'The rental request has been rejected.',
        variant: 'destructive',
      });
    } finally {
      // Clear loading state
      setLoadingNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const handleConfirmComplete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setLoadingNotifications(prev => new Set([...prev, notificationId]));
    
    try {
      await mockApiCall('confirm_complete');
      
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, status: 'completed', read: true }
            : n
        )
      );
      
      toast({
        title: 'Ride Confirmed',
        description: 'The ride has been marked as completed successfully.',
      });
    } finally {
      setLoadingNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const handleDisputeComplete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setLoadingNotifications(prev => new Set([...prev, notificationId]));
    
    try {
      await mockApiCall('dispute_complete');
      
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, status: 'disputed', read: true }
            : n
        )
      );
      
      toast({
        title: 'Completion Disputed',
        description: 'The ride completion has been disputed. Our team will review.',
        variant: 'destructive',
      });
    } finally {
      setLoadingNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const handlePayment = (notificationId: string, bookingId?: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigate(`/payment?bookingId=${bookingId}`);
    onClose?.();
  };

  const handleNotificationClick = (notification: Notification) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notification.id ? { ...item, read: true } : item,
      ),
    );

    if (isOwner) {
      markSocketNotificationAsRead(notification.id);
    }
  };

  const handleViewAll = () => {
    if (user?.role === 'owner') {
      navigate('/rental-requests');
    } else {
      navigate('/history');
    }
    onClose?.();
  };

  const renderNotificationItem = (notification: Notification) => {
    const isLoading = loadingNotifications.has(notification.id);
    
    return (
      <div
        key={notification.id}
        className={cn(
          'p-2 sm:p-3 hover:bg-accent/30 transition-all cursor-pointer group overflow-hidden',
          !notification.read && 'bg-primary/5 border-l-2 border-l-primary'
        )}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="flex gap-1.5 sm:gap-2 w-full">
          <div className="mt-0.5 p-1 sm:p-1.5 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
            {getIcon(notification.type)}
          </div>
          <div className="flex-1 space-y-1 sm:space-y-1.5 min-w-0 overflow-hidden w-full max-w-full">
            <div className="flex items-start justify-between gap-1.5 w-full">
              <p className="font-semibold text-xs sm:text-sm leading-tight truncate flex-1 min-w-0">
                {notification.title}
              </p>
              {!notification.read && (
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary flex-shrink-0 mt-1 animate-pulse" />
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground leading-snug break-words w-full">
              {notification.message}
            </p>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground/80 font-medium">
              {formatTime(notification.createdAt)}
            </p>
            
            {/* Owner: Accept/Reject buttons for rental requests */}
            {user?.role === 'owner' && notification.type === 'rental_request' && (
              <div className="flex flex-col sm:flex-row gap-1.5 pt-1.5 w-full">
                <Button
                  size="sm"
                  className="flex-1 h-7 sm:h-8 text-[10px] sm:text-xs font-medium min-w-0"
                  onClick={(e) => handleApprove(notification.id, e)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin" />
                      <span className="ml-1 truncate text-[9px] sm:text-[10px]">Loading...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="ml-1 hidden sm:inline">Accept</span>
                      <span className="ml-1 sm:hidden">✓</span>
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1 h-7 sm:h-8 text-[10px] sm:text-xs font-medium min-w-0"
                  onClick={(e) => handleReject(notification.id, e)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin" />
                      <span className="ml-1 truncate text-[9px] sm:text-[10px]">Loading...</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="ml-1 hidden sm:inline">Reject</span>
                      <span className="ml-1 sm:hidden">✗</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Renter: Payment button for approved requests */}
            {user?.role === 'renter' && notification.type === 'rental_approved' && (
              <div className="pt-1.5 w-full">
                <div className="mb-2 px-2 py-1.5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded text-[10px] sm:text-xs">
                  <p className="text-green-700 dark:text-green-400 font-medium">✓ Request Accepted</p>
                  <p className="text-green-600 dark:text-green-500 text-[9px] sm:text-[10px] mt-0.5">Complete your payment to confirm the booking</p>
                </div>
                <Button
                  size="sm"
                  className="w-full h-7 sm:h-8 text-[10px] sm:text-xs font-medium bg-green-600 hover:bg-green-700"
                  onClick={(e) => handlePayment(notification.id, notification.bookingId, e)}
                >
                  <CreditCard className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">Add Payment</span>
                </Button>
              </div>
            )}

            {/* Both Owner and Renter: Completed/Not Completed buttons for ride completion */}
            {notification.type === 'ride_completed' && notification.status === 'pending' && (
              <div className="flex flex-col sm:flex-row gap-1.5 pt-1.5 w-full">
                <Button
                  size="sm"
                  className="flex-1 h-7 sm:h-8 text-[10px] sm:text-xs font-medium bg-green-600 hover:bg-green-700 min-w-0"
                  onClick={(e) => handleConfirmComplete(notification.id, e)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin" />
                      <span className="ml-1 truncate text-[9px] sm:text-[10px]">Loading...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="ml-1 hidden sm:inline">Completed</span>
                      <span className="ml-1 sm:hidden">✓</span>
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-7 sm:h-8 text-[10px] sm:text-xs font-medium min-w-0"
                  onClick={(e) => handleDisputeComplete(notification.id, e)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin" />
                      <span className="ml-1 truncate text-[9px] sm:text-[10px]">Loading...</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="ml-1 hidden sm:inline">Not Completed</span>
                      <span className="ml-1 sm:hidden">✗</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Show status after completion confirmation */}
            {notification.type === 'ride_completed' && notification.status === 'completed' && (
              <div className="pt-1.5">
                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-green-600 font-medium">
                  <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  Confirmed as completed
                </div>
              </div>
            )}

            {/* Show status after dispute */}
            {notification.type === 'ride_completed' && notification.status === 'disputed' && (
              <div className="pt-1.5">
                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-orange-600 font-medium">
                  <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  Under review
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full max-w-md overflow-hidden">
      <div className="flex items-center justify-between p-2 sm:p-3 border-b bg-card flex-shrink-0">
        <h3 className="font-semibold text-xs sm:text-sm truncate mr-2">Notifications</h3>
        {notifications.some(n => !n.read) && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[10px] sm:text-xs h-6 px-1.5 sm:px-2 hover:bg-accent/50 flex-shrink-0 whitespace-nowrap"
            onClick={() => {
              setNotifications((prev) => {
                prev
                  .filter((notification) => !notification.read && isOwner)
                  .forEach((notification) => markSocketNotificationAsRead(notification.id));

                return prev.map((notification) => ({ ...notification, read: true }));
              });
              onMarkAsRead?.();
            }}
          >
            <span className="hidden sm:inline">Mark all read</span>
            <span className="sm:hidden">Mark</span>
          </Button>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'requests' | 'payments')} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full grid grid-cols-2 h-8 sm:h-9 mx-0 rounded-none border-b flex-shrink-0">
          <TabsTrigger value="requests" className="data-[state=active]:bg-primary/5 text-[10px] sm:text-xs px-1 truncate">
            <span className="hidden sm:inline">Rental Requests</span>
            <span className="sm:hidden truncate">Requests</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-primary/5 text-[10px] sm:text-xs px-1 truncate">
            Payments
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="requests" className="mt-0 overflow-hidden">
          <ScrollArea className="h-[320px] sm:h-[360px]">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground px-3">
                <Bell className="h-6 w-6 sm:h-8 sm:w-8 mb-2 opacity-40" />
                <p className="text-[10px] sm:text-xs font-medium">No rental notifications</p>
                <p className="text-[10px] mt-1">You&apos;re all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredNotifications.map(renderNotificationItem)}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="payments" className="mt-0 overflow-hidden">
          <ScrollArea className="h-[320px] sm:h-[360px]">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground px-3">
                <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 mb-2 opacity-40" />
                <p className="text-[10px] sm:text-xs font-medium">No payment notifications</p>
                <p className="text-[10px] mt-1">You&apos;re all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredNotifications.map(renderNotificationItem)}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Separator />
      
      <div className="p-1.5 sm:p-2 bg-card flex-shrink-0">
        <Button 
          variant="ghost" 
          className="w-full text-[10px] sm:text-xs hover:bg-accent/50 text-primary font-medium h-7 sm:h-8 truncate" 
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
