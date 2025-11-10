import { api } from "@/lib/api"

interface CreateBookingPayload {
  bikeId: string | number;
  startTime: string;
  endTime: string;
}

export const createBooking = async (payload: CreateBookingPayload) => {
    const response = await api.post(`/bookings`, payload);

    return response.data.data;
}




