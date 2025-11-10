import { io, Socket } from "socket.io-client";

const DEFAULT_SOCKET_PATH = "/socket";

const resolveSocketUrl = () => {
  const explicitUrl = import.meta.env.VITE_SOCKET_URL;
  if (explicitUrl) {
    return explicitUrl;
  }

  const apiBase = import.meta.env.VITE_BASE_API_URL;
  if (apiBase) {
    try {
      const url = new URL(apiBase);
      url.pathname = DEFAULT_SOCKET_PATH;
      return url.toString();
    } catch {
      // fall through to default
    }
  }

  return window.location.origin;
};

let socket: Socket | null = null;

export const getSocket = () => {
  if (typeof window === "undefined") {
    return null;
  }

  if (!socket) {
    const url = resolveSocketUrl();
    socket = io(url, {
      withCredentials: true,
      transports: ["websocket"],
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

