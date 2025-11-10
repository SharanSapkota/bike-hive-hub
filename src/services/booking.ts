import api from "@/lib/api"

export const createBooking = async (payload: any) => {
    const response = await api.post(`${import.meta.env.VITE_BASE_API_URL}/bookings`, {bikeId: payload.id, startTime: payload.startTime, endTime: payload.endTime});

    return response.data.data;
}




