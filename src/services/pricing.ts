import api from "@/lib/api";

export const calculatePrice = async (bikeId: string, startDate: Date, endDate: Date, pricePerDay: number): Promise<number> => {
  startDate = new Date(startDate);
  endDate = new Date(endDate);
  const response = await api.get(`/payments/pricing/calculate?bikeId=${bikeId}&startDate=${startDate}&endDate=${endDate}&pricePerDay=${pricePerDay}`);
  const payload = response.data?.data ?? response.data;
  return payload.totalAmount;
};

