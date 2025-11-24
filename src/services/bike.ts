import api from "@/lib/api";

export const getBikes = async () => {
  const response = await api.get("/bikes");
  return response.data;
};

export const getBikeDetails = async (id: string) => {
  const response = await api.get(`/bikes/${id}`);
  return response?.data?.data;
};

