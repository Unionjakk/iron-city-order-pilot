
import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';

const AdminLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-black to-zinc-900">
      <NavBar />

      <main className="flex-grow p-4">
        <Outlet />
      </main>
      
      <footer className="bg-zinc-900/80 backdrop-blur-sm border-t border-zinc-800 py-4 text-center">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-zinc-400">
            <div>
              <h3 className="text-orange-400 text-sm font-medium mb-2">Contact Us</h3>
              <p className="text-xs">support@ironcityshopify.com</p>
              <p className="text-xs">+1 (412) 555-1234</p>
            </div>
            <div>
              <h3 className="text-orange-400 text-sm font-medium mb-2">Policies</h3>
              <p className="text-xs">Privacy Policy</p>
              <p className="text-xs">Terms of Service</p>
            </div>
            <div>
              <h3 className="text-orange-400 text-sm font-medium mb-2">About</h3>
              <p className="text-xs">Iron City Shopify is a comprehensive order management system.</p>
            </div>
          </div>
          <div className="border-t border-zinc-800 pt-3">
            <p className="text-zinc-500 text-sm">© {new Date().getFullYear()} Iron City Shopify. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminLayout;
