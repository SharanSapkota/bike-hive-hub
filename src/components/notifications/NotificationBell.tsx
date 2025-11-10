import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import NotificationPanel from "./NotificationPanel";
import { useOwnerNotifications } from "@/hooks/useOwnerNotifications";
import { useAuth } from "@/contexts/AuthContext";

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { unreadCount, markAllAsRead } = useOwnerNotifications();

  useEffect(() => {
    if (!open || user?.role !== "owner") {
      return;
    }
    markAllAsRead();
  }, [open, user?.role, markAllAsRead]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-accent/10">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        <NotificationPanel 
          onMarkAsRead={markAllAsRead} 
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
