import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { GoogleMapsProvider } from "@/contexts/GoogleMapsContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import History from "./pages/History";
import Notifications from "./pages/Notifications";
import Install from "./pages/Install";
import MapView from "./pages/renter/MapView";
import Payment from "./pages/renter/Payment";
import BikeDetails from "./pages/renter/BikeDetails";
import MyBikes from "./pages/owner/MyBikes";
import Rentals from "./pages/owner/Rentals";
import RentalRequests from "./pages/owner/RentalRequests";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/install" element={<Install />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to={user?.role === 'renter' ? '/map' : '/dashboard'} replace />
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/history" element={<History />} />
        <Route path="/notifications" element={<ProtectedRoute allowedRoles={['owner', 'renter']}><Notifications /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute allowedRoles={['renter']}><MapView /></ProtectedRoute>} />
        <Route path="/bike/:bikeId" element={<ProtectedRoute allowedRoles={['renter']}><BikeDetails /></ProtectedRoute>} />
        <Route path="/payment" element={<ProtectedRoute allowedRoles={['renter']}><Payment /></ProtectedRoute>} />
        <Route path="/bikes" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><MyBikes /></ProtectedRoute>} />
        <Route path="/rentals" element={<ProtectedRoute allowedRoles={['owner']}><Rentals /></ProtectedRoute>} />
        <Route path="/rental-requests" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><RentalRequests /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <GoogleMapsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </GoogleMapsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
