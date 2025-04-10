
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/AdminLayout";

// Pages
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import UploadsIndex from "@/pages/admin/uploads/UploadsIndex";
import PinnacleUpload from "@/pages/admin/uploads/PinnacleUpload";
import HarleyUpload from "@/pages/admin/uploads/HarleyUpload";
import ShopifyAPI from "@/pages/admin/uploads/ShopifyAPI";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public route */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes - All under the same layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                {/* Main Dashboard */}
                <Route path="/" element={<Dashboard />} />
                
                {/* Admin routes */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/uploads" element={<UploadsIndex />} />
                <Route path="/admin/uploads/pinnacle" element={<PinnacleUpload />} />
                <Route path="/admin/uploads/harley" element={<HarleyUpload />} />
                <Route path="/admin/uploads/shopify" element={<ShopifyAPI />} />
              </Route>
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
