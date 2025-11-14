import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import type { Socket } from "socket.io-client";

import { useAuth } from "@/contexts/AuthContext";
import { getSocket } from "@/lib/socket";
import { toast } from "@/hooks/use-toast";
import {
  getNotificationCount,
  getNotifications,
} from "@/services/notification";
import { api } from "@/lib/api";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  read: boolean;
  data?: Record<string, any>;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  IncreaseUnreadCount: () => void;
  hasLoaded: boolean;
  loadNotifications: (force?: boolean) => Promise<void>;
  markAsRead: (id: string, callApi?: boolean) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

const normalizeTimestamp = (value: any) => {
  if (!value) {
    return new Date().toISOString();
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
};

const mapNotification = (payload: any): Notification => {
  const id =
    payload?.id ??
    payload?.notificationId ??
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`);

  const title =
    payload?.title ??
    (payload?.type === "rental_request"
      ? "New Rental Request"
      : "New Notification");

  const message =
    payload?.message ??
    payload?.description ??
    "You have a new update regarding your rentals.";

  const createdAt = normalizeTimestamp(
    payload?.createdAt ?? payload?.created_at ?? payload?.timestamp,
  );

  const read =
    typeof payload?.read === "boolean"
      ? payload.read
      : typeof payload?.isRead === "boolean"
      ? payload.isRead
      : false;

  return {
    id,
    title,
    message,
    type: payload?.type ?? "general",
    createdAt,
    read,
    data: payload?.data ?? payload,
  };
};

const mergeNotifications = (
  current: Notification[],
  incoming: Notification[],
) => {
  const map = new Map<string, Notification>();

  current.forEach((notification) => {
    map.set(notification.id, notification);
  });

  incoming.forEach((notification) => {
    const existing = map.get(notification.id);
    map.set(
      notification.id,
      existing
        ? {
            ...existing,
            ...notification,
          }
        : notification,
    );
  });

  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const count = await getNotificationCount();
    setUnreadCount(count);
  }, [user]);

  const loadNotifications = useCallback(
    async (force = false) => {
      if (!user || (hasLoaded && !force)) {
        return;
      }

      setIsLoading(true);
      try {
        const data = await getNotifications();
        const mapped = Array.isArray(data)
          ? data.map(mapNotification)
          : [];

        setNotifications((prev) => {
          const merged = mergeNotifications(prev, mapped);
          setUnreadCount(merged.filter((item) => !item.read).length);
          return merged;
        });
        setHasLoaded(true);
      } catch (error) {
        console.error("Failed to load notifications:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [hasLoaded, user],
  );

  const markAsRead = useCallback((id: string, callApi = true) => {
    if (callApi) {
      api.post(`/notifications/${id}/read`);
    }
    setNotifications((prev) => {
      const updated = prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      );
      setUnreadCount(updated.filter((notification) => !notification.read).length);
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((notification) => ({
        ...notification,
        read: true,
      }));
      setUnreadCount(0);
      return updated;
    });
  }, []);

  useEffect(() => {
    setNotifications([]);
    setHasLoaded(false);
    setUnreadCount(0);

    if (!user) {
      return;
    }

    fetchUnreadCount();
  }, [fetchUnreadCount, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const socket = getSocket();
    if (!socket) {
      return;
    }

    socketRef.current = socket;

    const handleNotification = (payload: any) => {
      const notification = mapNotification(payload);

      if (!notification.read) {
        setUnreadCount((prev) => prev + 1);
      }

      setNotifications((prev) => {
        if (!hasLoaded) {
          return prev;
        }
        return mergeNotifications(prev, [notification]);
      });

      toast({
        title: notification.title,
        description: notification.message,
      });
    };

    const ownerId = user.id;

    socket.on("owner:notification", handleNotification);
    if (ownerId) {
      socket.emit("owner:subscribe", { ownerId: String(ownerId) });
    }

    return () => {
      socket.off("owner:notification", handleNotification);
      if (ownerId) {
        socket.emit("owner:unsubscribe", { ownerId: String(ownerId) });
      }
      if (socketRef.current) {
        socketRef.current = null;
      }
    };
  }, [hasLoaded, user]);

  const IncreaseUnreadCount = useCallback(() => {
    console.log(unreadCount)
    setUnreadCount((prev) => prev + 1);
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    hasLoaded,
    loadNotifications,
    IncreaseUnreadCount,
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationContext must be used within a NotificationProvider",
    );
  }
  return context;
};
