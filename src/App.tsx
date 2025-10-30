import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoadScript } from "@react-google-maps/api";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import History from "./pages/History";
import Install from "./pages/Install";
import MapView from "./pages/renter/MapView";
import Payment from "./pages/renter/Payment";
import MyBikes from "./pages/owner/MyBikes";
import Rentals from "./pages/owner/Rentals";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyBHwNVP7Bp6AN2TbOQBLVrLx_yfeYdF6dc";
const libraries: ("places")[] = ["places"];

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
        <Route path="/map" element={<ProtectedRoute allowedRoles={['renter']}><MapView /></ProtectedRoute>} />
        <Route path="/payment/:bikeId" element={<ProtectedRoute allowedRoles={['renter']}><Payment /></ProtectedRoute>} />
        <Route path="/bikes" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><MyBikes /></ProtectedRoute>} />
        <Route path="/rentals" element={<ProtectedRoute allowedRoles={['owner']}><Rentals /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LoadScript 
        googleMapsApiKey={GOOGLE_MAPS_API_KEY}
        libraries={libraries}
        loadingElement={
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading maps...</p>
            </div>
          </div>
        }
      >
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </LoadScript>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
