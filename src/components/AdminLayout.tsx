
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import NavBar from './NavBar';

const AdminLayout = () => {
  const location = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-black to-zinc-900">
      <NavBar />

      <main className="flex-grow p-4">
        <Outlet />
      </main>
      
      <footer className="bg-zinc-900/80 backdrop-blur-sm border-t border-zinc-800 py-3 text-center text-zinc-500 text-sm">
        <p>© {new Date().getFullYear()} Iron City Shopify. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AdminLayout;
