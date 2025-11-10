import { useEffect, useState, useCallback } from "react";
import { Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export type OwnerNotificationType =
  | "rental_request"
  | "rental_approved"
  | "rental_rejected"
  | "rental_cancelled"
  | "payment"
  | "ride_completed"
  | string;

export interface OwnerNotification {
  id: string;
  title: string;
  message: string;
  type: OwnerNotificationType;
  createdAt: string;
  read: boolean;
  data?: Record<string, any>;
}

interface NotificationState {
  notifications: OwnerNotification[];
}

const OWNER_NOTIFICATION_EVENT = "owner:notification";
const OWNER_SUBSCRIBE_EVENT = "owner:subscribe";
const OWNER_UNSUBSCRIBE_EVENT = "owner:unsubscribe";

let socketInstance: Socket | null = null;
let ownerIdRef: string | null = null;
let state: NotificationState = {
  notifications: [],
};

type Listener = (nextState: NotificationState) => void;
const listeners = new Set<Listener>();

const notifyListeners = () => {
  listeners.forEach((listener) => listener(state));
};

const mapIncomingNotification = (payload: any): OwnerNotification => {
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
    "You have a new update regarding your bikes.";

  const createdAt =
    typeof payload?.createdAt === "string"
      ? payload.createdAt
      : new Date().toISOString();

  const type = (payload?.type ?? "rental_request") as OwnerNotificationType;

  return {
    id,
    title,
    message,
    type,
    createdAt,
    read: false,
    data: payload?.data ?? payload,
  };
};

const ensureSocket = (ownerId: string) => {
  if (socketInstance && ownerIdRef === ownerId) {
    return;
  }

  socketInstance = getSocket();
  ownerIdRef = ownerId;

  if (!socketInstance) {
    return;
  }

  const handleNotification = (payload: any) => {
    const notification = mapIncomingNotification(payload);
    state = {
      notifications: [notification, ...state.notifications],
    };
    notifyListeners();

    toast({
      title: notification.title,
      description: notification.message,
    });
  };

  socketInstance.on(OWNER_NOTIFICATION_EVENT, handleNotification);
  socketInstance.emit(OWNER_SUBSCRIBE_EVENT, { ownerId });

  const cleanup = () => {
    if (!socketInstance) return;
    socketInstance.off(OWNER_NOTIFICATION_EVENT, handleNotification);
    socketInstance.emit(OWNER_UNSUBSCRIBE_EVENT, { ownerId });
    if (listeners.size === 0) {
      socketInstance = null;
      ownerIdRef = null;
    }
  };

  return cleanup;
};

export const useOwnerNotifications = () => {
  const { user } = useAuth();
  const [localState, setLocalState] = useState<NotificationState>(state);

  useEffect(() => {
    const isOwner = user?.role === "owner";
    if (!isOwner || !user?.id) {
      return;
    }

    const cleanupSocket = ensureSocket(String(user.id));

    const listener: Listener = (nextState) => {
      setLocalState(nextState);
    };

    listeners.add(listener);
    setLocalState(state);

    return () => {
      listeners.delete(listener);
      if (cleanupSocket) {
        cleanupSocket();
      }
    };
  }, [user?.id, user?.role]);

  const markAllAsRead = useCallback(() => {
    if (state.notifications.every((n) => n.read)) {
      return;
    }
    state = {
      notifications: state.notifications.map((notification) => ({
        ...notification,
        read: true,
      })),
    };
    notifyListeners();
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    state = {
      notifications: state.notifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification,
      ),
    };
    notifyListeners();
  }, []);

  return {
    notifications: localState.notifications,
    unreadCount: localState.notifications.filter((notification) => !notification.read).length,
    markAllAsRead,
    markAsRead,
  };
};

