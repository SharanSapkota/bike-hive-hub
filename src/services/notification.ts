import { api } from "@/lib/api";

export const getNotificationCount = async (): Promise<number> => {
  try {
    const response = await api.get("/notifications/count");
    const count = response?.data?.data;

    return count;
  } catch (error: any) {
    console.error("Failed to fetch notification count:", error);
    return 0;
  }
};

export const getNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data.data ?? response.data ?? [];
};