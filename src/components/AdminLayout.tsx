
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

const AdminLayout = () => {
  const { signOut, user } = useAuth();
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-black to-zinc-900">
      <header className="bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Link to="/" className="text-xl font-bold text-orange-500">Iron City Shopify</Link>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-orange-300">
              Welcome, {user?.user_metadata.full_name || 'Admin'}
            </span>
            <Button variant="outline" size="sm" onClick={signOut} 
              className="border-zinc-700 text-orange-400 hover:bg-zinc-800 hover:text-orange-300">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-grow">
        <aside className="w-64 bg-zinc-900/60 backdrop-blur-sm border-r border-zinc-800 p-4 hidden md:block">
          <nav className="space-y-2">
            <Link 
              to="/" 
              className={`block px-4 py-2 rounded-md ${
                isActive('/') && !isActive('/admin') 
                  ? 'bg-zinc-800 text-orange-400 font-medium' 
                  : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300'
              }`}
            >
              Dashboard
            </Link>
            <div className="pt-2 pb-1">
              <p className="px-4 text-xs font-medium text-orange-500/70 uppercase">Admin</p>
            </div>
            <Link 
              to="/admin/uploads" 
              className={`block px-4 py-2 rounded-md ${
                isActive('/admin/uploads') 
                  ? 'bg-zinc-800 text-orange-400 font-medium' 
                  : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300'
              }`}
            >
              Uploads
            </Link>
            <Link 
              to="/admin/uploads/pinnacle" 
              className={`block px-4 py-2 rounded-md ml-4 text-sm ${
                isActive('/admin/uploads/pinnacle') 
                  ? 'bg-zinc-800 text-orange-400 font-medium' 
                  : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300'
              }`}
            >
              Pinnacle Upload
            </Link>
            <Link 
              to="/admin/uploads/harley" 
              className={`block px-4 py-2 rounded-md ml-4 text-sm ${
                isActive('/admin/uploads/harley') 
                  ? 'bg-zinc-800 text-orange-400 font-medium' 
                  : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300'
              }`}
            >
              Harley Upload
            </Link>
            <Link 
              to="/admin/uploads/shopify" 
              className={`block px-4 py-2 rounded-md ml-4 text-sm ${
                isActive('/admin/uploads/shopify') 
                  ? 'bg-zinc-800 text-orange-400 font-medium' 
                  : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300'
              }`}
            >
              Shopify API
            </Link>
          </nav>
        </aside>

        <main className="flex-grow p-4">
          <Outlet />
        </main>
      </div>
      
      <footer className="bg-zinc-900/80 backdrop-blur-sm border-t border-zinc-800 py-3 text-center text-zinc-500 text-sm">
        <p>© {new Date().getFullYear()} Iron City Shopify. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AdminLayout;
