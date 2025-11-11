import { api } from "@/lib/api";

export const getNotificationCount = async (): Promise<number> => {
  try {
    const response = await api.get("/notifications/count");
    const payload = response?.data;
    const count =
      typeof payload?.data === "number"
        ? payload.data
        : typeof payload?.count === "number"
        ? payload.count
        : typeof payload?.data?.count === "number"
        ? payload.data.count
        : payload?.data?.total ?? payload?.total ?? payload;

    return typeof count === "number" ? count : 0;
  } catch (error: any) {
    console.error("Failed to fetch notification count:", error);
    return 0;
  }
};

export const getNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data.data ?? response.data ?? [];
};