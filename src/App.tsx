
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Outlet,
  Navigate
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Import pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import UsersPage from "./pages/users/UsersPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSettings from "./pages/admin/AdminSettings";
import UploadsIndex from "./pages/admin/uploads/UploadsIndex";
import PinnacleUpload from "./pages/admin/uploads/PinnacleUpload";
import HarleyUpload from "./pages/admin/uploads/HarleyUpload";
import OpenOrdersUpload from "./pages/admin/uploads/harley/OpenOrdersUpload";
import OrderLinesUpload from "./pages/admin/uploads/harley/OrderLinesUpload";
import OpenLinesCheckIn from "./pages/admin/uploads/harley/OpenLinesCheckIn";
import BackordersUpload from "./pages/admin/uploads/harley/BackordersUpload";
import LineItemsExclude from "./pages/admin/uploads/harley/LineItemsExclude";
import ShopifyAPI from "./pages/admin/uploads/shopify/ShopifyAPIPage";
import ActionsIndex from "./pages/actions/ActionsIndex";
import PicklistPage from "./pages/actions/PicklistPage";
import ToOrderPage from "./pages/actions/ToOrderPage";
import OrderedPage from "./pages/actions/OrderedPage";
import PickedPage from "./pages/actions/PickedPage";
import DispatchPage from "./pages/actions/DispatchPage";
import BackorderPage from "./pages/actions/BackorderPage";
import BackorderReportPage from "./pages/actions/BackorderReportPage";
import VisualiserPage from "./pages/actions/VisualiserPage";

// Import components
import Footer from "./components/Footer";
import NavBar from "./components/NavBar";

// Import contexts
import { AuthProvider } from "./context/AuthContext";

// Import protected route component
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <div className="h-screen flex flex-col">
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            
            {/* Add a redirect for direct /visualiser access */}
            <Route path="/visualiser" element={<Navigate to="/actions/visualiser" replace />} />
            
            {/* Add ProtectedRoute wrapper for all pages needing authentication */}
            <Route element={<ProtectedRoute />}>
              {/* Layout with NavBar for all authenticated routes */}
              <Route element={
                <>
                  <NavBar />
                  <main className="flex-grow container mx-auto px-4 py-6">
                    <Outlet />
                  </main>
                </>
              }>
                {/* Include the Index route inside the protected route with NavBar */}
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Actions Routes */}
                <Route path="/actions" element={<ActionsIndex />} />
                <Route path="/actions/picklist" element={<PicklistPage />} />
                <Route path="/actions/to-order" element={<ToOrderPage />} />
                <Route path="/actions/ordered" element={<OrderedPage />} />
                <Route path="/actions/picked" element={<PickedPage />} />
                <Route path="/actions/dispatch" element={<DispatchPage />} />
                <Route path="/actions/backorder" element={<BackorderPage />} />
                <Route path="/actions/backorder-report" element={<BackorderReportPage />} />
                <Route path="/actions/visualiser" element={<VisualiserPage />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/uploads" element={<UploadsIndex />} />
                <Route path="/admin/uploads/pinnacle" element={<PinnacleUpload />} />
                <Route path="/admin/uploads/harley" element={<HarleyUpload />} />
                <Route path="/admin/uploads/harley/open-orders" element={<OpenOrdersUpload />} />
                <Route path="/admin/uploads/harley/order-lines" element={<OrderLinesUpload />} />
                <Route path="/admin/uploads/harley/open-lines-check-in" element={<OpenLinesCheckIn />} />
                <Route path="/admin/uploads/harley/backorders" element={<BackordersUpload />} />
                <Route path="/admin/uploads/harley/line-items-exclude" element={<LineItemsExclude />} />
                <Route path="/admin/uploads/shopify" element={<ShopifyAPI />} />
                <Route path="/users" element={<UsersPage />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </Router>
      <Footer />
    </div>
  );
}

export default App;
