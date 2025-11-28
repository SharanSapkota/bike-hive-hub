
// import api from "@/lib/api";

// import { createContext, ReactNode, useCallback, useContext, useState } from "react";
  
//   export interface Category {
//    id: string;
//    name: string;
//    description: string;
//   }
  
//   interface CategoryContextType {
//     categories: Category[];
//     setCategories: (categories: Category[]) => void;
//     getCategories: () => Promise<void>;
//     createCategory: (category: Category) => Promise<void>;
//     updateCategory: (category: Category) => Promise<void>;
//     deleteCategory: (id: string) => Promise<void>;
//   }

// const BookingContext = createContext<CategoryContextType | undefined>(undefined);

// export const useBookingContext = () => {
//   const context = useContext(BookingContext);
//   if (context === undefined) {
//     throw new Error('useBookingContext must be used within BookingProvider');
//   }
//   return context;
// };

// export const BookingProvider = ({ children, user }: { children: ReactNode, user: any }) => {
//   const [bookings, setBookings] = useState<any[]>([]);

//   const getBookings = useCallback(async () => {
//     try {
//       const response = await api.get("/bookings/my");
//       const bookings = response?.data?.data;
//       setBookings(bookings);
//     } catch (error) {
//       console.error("Error getting bookings:", error);
//     }
//   }, []);

//   const createBooking = useCallback(async (booking: any) => {
//     try {
//       const response = await api.post("/bookings", booking);
//       const newBooking = response?.data.data;
//       setBookings([...bookings, newBooking]);
//     } catch (error) {
//       console.error("Error creating booking:", error);
//     }
//   }, []);

//   const updateBooking = useCallback(async (booking: any) => {
//     try {
//       const response = await api.put(`/bookings/${booking.id}`, booking);
//       const updatedBooking = response?.data?.data;
//       setBookings(bookings.map((b) => b.id === updatedBooking.id ? updatedBooking : b));
//     }
//     catch (error) {
//       console.error("Error updating booking:", error);
//     }
//   }, []);

//   const deleteBooking = useCallback(async (id: string) => {
//     try {
//       const response = await api.delete(`/bookings/${id}`);
//       setBookings(bookings.filter((b) => b.id !== id));
//       return response?.data?.data;
//     }
//     catch (error) {
//       console.error("Error deleting booking:", error);
//     }
//   }, []);
//   return (
//     <BookingContext.Provider value={{ bookings, setBookings, getBookings, createBooking, updateBooking, deleteBooking }}>
//       {children}
//     </BookingContext.Provider>
//   );
// };