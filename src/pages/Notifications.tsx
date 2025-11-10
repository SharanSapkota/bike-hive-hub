import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Clock, CheckCheck, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const Notifications = () => {
  const {
    notifications,
    markAsRead,
    loadNotifications,
    isLoading,
    hasLoaded,
  } = useNotificationContext();

  const [activeTab, setActiveTab] = useState("bookings");

  useEffect(() => {
    loadNotifications(true);
  }, [loadNotifications]);

  const handleAcceptBooking = async (notificationId: string, bookingId: string) => {
    try {
      await api.put(`/bookings/${bookingId}/approve`);
      toast({
        title: "Booking Accepted",
        description: "The booking request has been approved.",
      });
      markAsRead(notificationId);
      loadNotifications(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept booking request.",
        variant: "destructive",
      });
    }
  };

  const handleRejectBooking = async (notificationId: string, bookingId: string) => {
    try {
      await api.put(`/bookings/${bookingId}/reject`);
      toast({
        title: "Booking Rejected",
        description: "The booking request has been rejected.",
      });
      markAsRead(notificationId);
      loadNotifications(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject booking request.",
        variant: "destructive",
      });
    }
  };

  const bookingNotifications = notifications.filter(
    (n) => n.type === "rental_request" || n.type === "rental_approved" || n.type === "rental_rejected"
  );

  const paymentNotifications = notifications.filter(
    (n) => n.type === "payment"
  );

  const otherNotifications = notifications.filter(
    (n) => !["rental_request", "rental_approved", "rental_rejected", "payment"].includes(n.type)
  );

  const getNotificationIcon = (type: string) => {
    return <Bell className="h-5 w-5" />;
  };

  const getNotificationBadgeVariant = (type: string) => {
    switch (type) {
      case "rental_request":
        return "default";
      case "rental_approved":
        return "default";
      case "rental_rejected":
        return "destructive";
      case "payment":
        return "default";
      case "ride_completed":
        return "default";
      default:
        return "secondary";
    }
  };

  const renderNotificationList = (notificationList: typeof notifications) => {
    if (notificationList.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notifications</h3>
            <p className="text-muted-foreground text-center">
              You don't have any notifications in this category
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {notificationList.map((notification) => (
          <Card
            key={notification.id}
            className={`transition-colors ${
              notification.read ? "opacity-70" : "border-primary/50"
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {notification.title}
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getNotificationBadgeVariant(notification.type)}>
                    {notification.type.replace(/_/g, " ")}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => markAsRead(notification.id)}
                  >
                    {notification.read ? (
                      <CheckCheck className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                  })}
                </div>
                {notification.type === "rental_request" && !notification.read && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() =>
                        handleAcceptBooking(
                          notification.id,
                          notification.data?.bookingId || notification.data?.rentalId
                        )
                      }
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        handleRejectBooking(
                          notification.id,
                          notification.data?.bookingId || notification.data?.rentalId
                        )
                      }
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Notifications</h1>
        <p className="text-muted-foreground">
          Stay updated with your rental requests and activities
        </p>
      </div>

      {isLoading && !hasLoaded ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
            <Bell className="h-12 w-12 animate-pulse" />
            <p className="font-medium">Loading notifications...</p>
          </CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
            <p className="text-muted-foreground text-center">
              You'll see notifications here when there are updates about your bikes
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="bookings">
              Bookings ({bookingNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="payments">
              Payments ({paymentNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="others">
              Others ({otherNotifications.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="bookings">
            {renderNotificationList(bookingNotifications)}
          </TabsContent>
          <TabsContent value="payments">
            {renderNotificationList(paymentNotifications)}
          </TabsContent>
          <TabsContent value="others">
            {renderNotificationList(otherNotifications)}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Notifications;
