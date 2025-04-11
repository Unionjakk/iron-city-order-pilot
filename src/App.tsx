
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
import ShopifyAPI from "@/pages/admin/uploads/ShopifyAPI";
import AdminSettings from "@/pages/admin/AdminSettings";

// Harley Davidson Pages
import HarleyUploadDashboard from "@/pages/admin/uploads/harley/HarleyUploadDashboard";
import OpenOrdersUpload from "@/pages/admin/uploads/harley/OpenOrdersUpload";
import OrderLinesUpload from "@/pages/admin/uploads/harley/OrderLinesUpload";
import BackordersUpload from "@/pages/admin/uploads/harley/BackordersUpload";
import LineItemsExclude from "@/pages/admin/uploads/harley/LineItemsExclude";
import OpenLinesCheckIn from "@/pages/admin/uploads/harley/OpenLinesCheckIn";

// User Pages
import UsersPage from "@/pages/users/UsersPage";

// Action Pages
import ActionsIndex from "@/pages/actions/ActionsIndex";
import PicklistPage from "@/pages/actions/PicklistPage";
import ToOrderPage from "@/pages/actions/ToOrderPage";
import BackorderPage from "@/pages/actions/BackorderPage";
import PickedPage from "@/pages/actions/PickedPage";
import OrderedPage from "@/pages/actions/OrderedPage";
import DispatchPage from "@/pages/actions/DispatchPage";
import BackorderReportPage from "@/pages/actions/BackorderReportPage";

// Visualiser Page
import VisualiserPage from "@/pages/VisualiserPage";

// Placeholder Pages
import OrderLookupPlaceholder from "@/components/placeholder/OrderLookupPlaceholder";
import AccountantCorrectionsPlaceholder from "@/components/placeholder/AccountantCorrectionsPlaceholder";

// Main index page
import Index from "@/pages/Index";

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
                <Route path="/" element={<Index />} />
                
                {/* Users management */}
                <Route path="/users" element={<UsersPage />} />
                
                {/* Actions routes */}
                <Route path="/actions" element={<ActionsIndex />} />
                <Route path="/actions/picklist" element={<PicklistPage />} />
                <Route path="/actions/toorder" element={<ToOrderPage />} />
                <Route path="/actions/backorder" element={<BackorderPage />} />
                <Route path="/actions/picked" element={<PickedPage />} />
                <Route path="/actions/ordered" element={<OrderedPage />} />
                <Route path="/actions/dispatch" element={<DispatchPage />} />
                <Route path="/actions/backorder-report" element={<BackorderReportPage />} />
                
                {/* Tools routes */}
                <Route path="/visualiser" element={<VisualiserPage />} />
                <Route path="/order-lookup" element={<OrderLookupPlaceholder />} />
                <Route path="/accountant-corrections" element={<AccountantCorrectionsPlaceholder />} />
                <Route path="/tools" element={<Navigate to="/visualiser" replace />} />
                
                {/* Admin routes */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/uploads" element={<UploadsIndex />} />
                <Route path="/admin/uploads/pinnacle" element={<PinnacleUpload />} />
                
                {/* Harley Davidson Upload routes - main route displays dashboard */}
                <Route path="/admin/uploads/harley" element={<HarleyUploadDashboard />} />
                <Route path="/admin/uploads/harley/dashboard" element={<Navigate to="/admin/uploads/harley" replace />} />
                <Route path="/admin/uploads/harley/open-orders" element={<OpenOrdersUpload />} />
                <Route path="/admin/uploads/harley/order-lines" element={<OrderLinesUpload />} />
                <Route path="/admin/uploads/harley/backorders" element={<BackordersUpload />} />
                <Route path="/admin/uploads/harley/open-order-check-in" element={<LineItemsExclude />} />
                <Route path="/admin/uploads/harley/open-lines-check-in" element={<OpenLinesCheckIn />} />
                
                <Route path="/admin/uploads/shopify" element={<ShopifyAPI />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
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
