import api from "@/lib/api";

export const getGears = async (params?: {
  lat?: number;
  lng?: number;
  category?: string;
  subCategory?: string;
  search?: string;
}) => {
  const response = await api.get("/bikes", { params });
  return response.data;
};

export const getGearDetails = async (id: string) => {
  const response = await api.get(`/bikes/${id}`);
  return response.data.data;
};

export const getCategories = async () => {
  // This will call the API to get categories
  // For now using the bikes endpoint structure
  const response = await api.get("/bikes/categories");
  return response.data;
};
