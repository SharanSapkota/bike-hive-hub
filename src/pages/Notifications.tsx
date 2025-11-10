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
    <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-4xl">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Booking Notifications</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
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
        <div className="space-y-3 sm:space-y-4">
          {bookingNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-colors ${
                notification.read ? "opacity-70" : "border-primary/50"
              }`}
            >
              <CardHeader className="p-3 sm:p-6">
                <div className="flex items-start justify-between gap-2 sm:gap-4">
                  <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="mt-0.5 sm:mt-1 flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-0.5 sm:space-y-1 min-w-0">
                      <CardTitle className="text-sm sm:text-base flex items-center gap-1.5 sm:gap-2">
                        <span className="truncate">{notification.title}</span>
                        {!notification.read && (
                          <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <Badge variant={getNotificationBadgeVariant(notification.type)} className="text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 hidden sm:inline-flex">
                      {notification.type.replace(/_/g, " ")}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8"
                      onClick={() => markAsRead(notification.id)}
                    >
                      {notification.read ? (
                        <CheckCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                      ) : (
                        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Compact User Details - Only for rental requests */}
                {notification.type === "rental_request" && notification.data && (
                  <div className="mb-3 p-2 sm:p-3 rounded-md bg-muted/30 border border-border/50 inline-flex items-center gap-2 max-w-fit">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                      <span className="font-semibold text-xs sm:text-sm whitespace-nowrap">
                        {notification.data.userName || "Renter"}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                star <= (notification.data.userRating || 0)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground/40"
                              }`}
                            />
                          ))}
                          <span className="ml-0.5 font-medium text-foreground">
                            {notification.data.userRating?.toFixed(1) || "N/A"}
                          </span>
                        </div>
                        <span className="text-muted-foreground text-[10px] sm:text-xs">
                          ({notification.data.userReviewCount || 0})
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className="truncate">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  {notification.type === "rental_request" && !notification.read && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 sm:flex-none text-xs h-8"
                        onClick={() =>
                          handleAcceptBooking(
                            notification.id,
                            notification.data?.bookingId || notification.data?.rentalId
                          )
                        }
                      >
                        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Accept</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 sm:flex-none text-xs h-8"
                        onClick={() =>
                          handleRejectBooking(
                            notification.id,
                            notification.data?.bookingId || notification.data?.rentalId
                          )
                        }
                      >
                        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Reject</span>
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
