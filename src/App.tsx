import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet
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
import AdminFlowChart from "./pages/admin/settings/AdminFlowChart";
import UploadsIndex from "./pages/admin/uploads/UploadsIndex";
import PinnacleUpload from "./pages/admin/uploads/PinnacleUpload";
import HarleyUpload from "./pages/admin/uploads/HarleyUpload";
import HarleyUploadDashboard from "./pages/admin/uploads/harley/HarleyUploadDashboard";
import OpenOrdersUpload from "./pages/admin/uploads/harley/OpenOrdersUpload";
import OrderLinesUpload from "./pages/admin/uploads/harley/OrderLinesUpload";
import OpenLinesCheckIn from "./pages/admin/uploads/harley/OpenLinesCheckIn";
import BackordersUpload from "./pages/admin/uploads/harley/BackordersUpload";
import LineItemsExclude from "./pages/admin/uploads/harley/LineItemsExclude";
import ShopifyV2Page from "./pages/admin/uploads/shopify/ShopifyV2Page";
import ShopifyOldAPIPage from "./pages/admin/uploads/shopify/oldAPI/ShopifyOldAPIPage";
import ShopifyAPIRedirect from "./pages/admin/uploads/ShopifyAPIRedirect";
import ActionsIndex from "./pages/actions/ActionsIndex";
import PicklistPage from "./pages/actions/PicklistPage";
import OldPicklistPage from "./pages/actions/OldPicklistPage";
import ToOrderPage from "./pages/actions/ToOrderPage";
import OrderedPage from "./pages/actions/OrderedPage";
import PickedPage from "./pages/actions/PickedPage";
import DispatchPage from "./pages/actions/DispatchPage";
import BackorderPage from "./pages/actions/BackorderPage";
import BackorderReportPage from "./pages/actions/BackorderReportPage";
import VisualiserPage from "./pages/actions/VisualiserPage";
import DragAndDropPage from "./pages/tools/DragAndDropPage";
import OrderLookupPlaceholder from "./components/placeholder/OrderLookupPlaceholder";
import AccountantCorrectionsPlaceholder from "./components/placeholder/AccountantCorrectionsPlaceholder";

// Import components
import Footer from "./components/Footer";
import NavBar from "./components/NavBar";

// Import contexts
import { AuthProvider } from "./context/AuthContext";

// Import protected route component
import ProtectedRoute from "./components/ProtectedRoute";
import ShopifyDashboard from "./pages/admin/uploads/shopify/ShopifyDashboard";
import DeleteAllPage from "./pages/admin/uploads/shopify/pages/DeleteAllPage";
import ImportAllPage from "./pages/admin/uploads/shopify/pages/ImportAllPage";
import BatchLocationPage from "./pages/admin/uploads/shopify/pages/BatchLocationPage";
import PicklistPage from "./pages/admin/uploads/shopify/pages/PicklistPage";

function App() {
  return (
    <div className="h-screen flex flex-col">
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            
            {/* Add redirects for URL variations */}
            <Route path="/visualiser" element={<Navigate to="/actions/visualiser" replace />} />
            <Route path="/actions/toorder" element={<Navigate to="/actions/to-order" replace />} />
            
            {/* Redirect /admin/uploads/harley to the dashboard */}
            <Route path="/admin/uploads/harley" element={<Navigate to="/admin/uploads/harley/dashboard" replace />} />
            
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
                <Route path="/actions/oldpicklist" element={<OldPicklistPage />} />
                <Route path="/actions/to-order" element={<ToOrderPage />} />
                <Route path="/actions/ordered" element={<OrderedPage />} />
                <Route path="/actions/picked" element={<PickedPage />} />
                <Route path="/actions/dispatch" element={<DispatchPage />} />
                <Route path="/actions/backorder" element={<BackorderPage />} />
                <Route path="/actions/backorder-report" element={<BackorderReportPage />} />
                <Route path="/actions/visualiser" element={<VisualiserPage />} />
                
                {/* Tools Routes */}
                <Route path="/drag-and-drop" element={<DragAndDropPage />} />
                <Route path="/order-lookup" element={<OrderLookupPlaceholder />} />
                <Route path="/accountant-corrections" element={<AccountantCorrectionsPlaceholder />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/settings/adminflowchart" element={<AdminFlowChart />} />
                <Route path="/admin/uploads" element={<UploadsIndex />} />
                <Route path="/admin/uploads/pinnacle" element={<PinnacleUpload />} />
                
                {/* Harley Davidson Upload Routes */}
                <Route path="/admin/uploads/harley/dashboard" element={<HarleyUploadDashboard />} />
                <Route path="/admin/uploads/harley/open-orders" element={<OpenOrdersUpload />} />
                <Route path="/admin/uploads/harley/order-lines" element={<OrderLinesUpload />} />
                <Route path="/admin/uploads/harley/open-lines-check-in" element={<OpenLinesCheckIn />} />
                <Route path="/admin/uploads/harley/open-order-check-in" element={<LineItemsExclude />} />
                <Route path="/admin/uploads/harley/backorders" element={<BackordersUpload />} />
                <Route path="/admin/uploads/harley/line-items-exclude" element={<LineItemsExclude />} />
                
                {/* Shopify API Routes */}
                <Route path="/admin/uploads/shopify" element={<ShopifyDashboard />} />
                <Route path="/admin/uploads/shopify/v2" element={<ShopifyV2Page />} />
                <Route path="/admin/uploads/shopify/deleteall" element={<DeleteAllPage />} />
                <Route path="/admin/uploads/shopify/importall" element={<ImportAllPage />} />
                <Route path="/admin/uploads/shopify/batchlocation" element={<BatchLocationPage />} />
                <Route path="/admin/uploads/shopify/picklist" element={<PicklistPage />} />
                <Route path="/admin/uploads/shopify/oldAPI" element={<ShopifyOldAPIPage />} />
                <Route path="/admin/uploads/ShopifyAPI" element={<ShopifyAPIRedirect />} />
                
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
