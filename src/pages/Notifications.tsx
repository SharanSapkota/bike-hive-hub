import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Clock, CheckCheck, Check, X, Star, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useEffect } from "react";
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

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Booking Notifications</h1>
        <p className="text-muted-foreground">
          Manage your rental booking requests
        </p>
      </div>

      {isLoading && !hasLoaded ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
            <Bell className="h-12 w-12 animate-pulse" />
            <p className="font-medium">Loading notifications...</p>
          </CardContent>
        </Card>
      ) : bookingNotifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No booking notifications</h3>
            <p className="text-muted-foreground text-center">
              You'll see booking requests here when renters want to rent your bikes
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookingNotifications.map((notification) => (
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
                {/* User Details Section - Only for rental requests */}
                {notification.type === "rental_request" && notification.data && (
                  <div className="mb-4 p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">
                          {notification.data.userName || "Renter"}
                        </h4>
                        <div className="flex items-center gap-3 text-sm">
                          {/* Rating Display */}
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= (notification.data.userRating || 0)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                            <span className="ml-1 font-medium">
                              {notification.data.userRating?.toFixed(1) || "N/A"}
                            </span>
                          </div>
                          {/* Review Count */}
                          <span className="text-muted-foreground">
                            ({notification.data.userReviewCount || 0} reviews)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
      )}
    </div>
  );
};

export default Notifications;
