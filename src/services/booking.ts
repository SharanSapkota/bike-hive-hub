import api from "@/lib/api";

interface CreateBookingParams {
  bike: string;
  startDate: string;
  endDate: string;
}

export const createBooking = async (params: CreateBookingParams) => {
  try {
    // Mock booking creation - replace with actual API call
    const response = await api.post("/bookings", params);
    return response.data;
  } catch (error) {
    console.error("Failed to create booking:", error);
    throw error;
  }
};
