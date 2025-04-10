
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Upload, 
  Settings, 
  LogOut,
  ChevronDown,
  Menu as MenuIcon
} from 'lucide-react';
import { useState } from 'react';

const AdminLayout = () => {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [uploadsMenuOpen, setUploadsMenuOpen] = useState(
    location.pathname.startsWith('/admin/uploads')
  );
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };

  const toggleUploadsMenu = () => {
    setUploadsMenuOpen(prev => !prev);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-black to-zinc-900">
      <header className="bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Link to="/" className="text-xl font-bold text-orange-500">Iron City Shopify</Link>
          </div>
          
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMobileMenu}
              className="text-orange-400 hover:bg-zinc-800 hover:text-orange-300"
            >
              <MenuIcon className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-orange-300">
              Welcome, {user?.user_metadata.full_name || 'Admin'}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut} 
              className="border-zinc-700 text-orange-400 hover:bg-zinc-800 hover:text-orange-300"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-grow">
        {/* Sidebar for desktop */}
        <aside className={`w-64 bg-zinc-900/60 backdrop-blur-sm border-r border-zinc-800 p-4 hidden md:block`}>
          <nav className="space-y-2">
            <Link 
              to="/" 
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                isActive('/') && !isActive('/admin') 
                  ? 'bg-zinc-800 text-orange-400 font-medium' 
                  : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            
            <div className="pt-2 pb-1">
              <p className="px-4 text-xs font-medium text-orange-500/70 uppercase">Admin</p>
            </div>

            <div>
              <button
                onClick={toggleUploadsMenu}
                className={`flex items-center justify-between w-full px-4 py-2 rounded-md ${
                  isActive('/admin/uploads') 
                    ? 'bg-zinc-800 text-orange-400 font-medium' 
                    : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  <span>Uploads</span>
                </div>
                <ChevronDown 
                  className={`h-4 w-4 transition-transform ${uploadsMenuOpen ? 'rotate-180' : ''}`} 
                />
              </button>
              
              {uploadsMenuOpen && (
                <div className="ml-4 mt-1 space-y-1">
                  <Link 
                    to="/admin/uploads/pinnacle" 
                    className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md ${
                      isActive('/admin/uploads/pinnacle') 
                        ? 'bg-zinc-800 text-orange-400 font-medium' 
                        : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300'
                    }`}
                  >
                    <span>Pinnacle Upload</span>
                  </Link>
                  <Link 
                    to="/admin/uploads/harley" 
                    className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md ${
                      isActive('/admin/uploads/harley') 
                        ? 'bg-zinc-800 text-orange-400 font-medium' 
                        : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300'
                    }`}
                  >
                    <span>Harley Upload</span>
                  </Link>
                  <Link 
                    to="/admin/uploads/shopify" 
                    className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md ${
                      isActive('/admin/uploads/shopify') 
                        ? 'bg-zinc-800 text-orange-400 font-medium' 
                        : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300'
                    }`}
                  >
                    <span>Shopify API</span>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </aside>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={toggleMobileMenu}>
            <div className="h-full w-64 bg-zinc-900 border-r border-zinc-800 p-4" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm text-orange-300">
                  Welcome, {user?.user_metadata.full_name || 'Admin'}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut} 
                  className="border-zinc-700 text-orange-400 hover:bg-zinc-800 hover:text-orange-300"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
              
              <nav className="space-y-2">
                <Link 
                  to="/" 
                  className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                    isActive('/') && !isActive('/admin') 
                      ? 'bg-zinc-800 text-orange-400 font-medium' 
                      : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300'
                  }`}
                  onClick={toggleMobileMenu}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                
                <div className="pt-2 pb-1">
                  <p className="px-4 text-xs font-medium text-orange-500/70 uppercase">Admin</p>
                </div>

                <div>
                  <button
                    onClick={toggleUploadsMenu}
                    className={`flex items-center justify-between w-full px-4 py-2 rounded-md ${
                      isActive('/admin/uploads') 
                        ? 'bg-zinc-800 text-orange-400 font-medium' 
                        : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      <span>Uploads</span>
                    </div>
                    <ChevronDown 
                      className={`h-4 w-4 transition-transform ${uploadsMenuOpen ? 'rotate-180' : ''}`} 
                    />
                  </button>
                  
                  {uploadsMenuOpen && (
                    <div className="ml-4 mt-1 space-y-1">
                      <Link 
                        to="/admin/uploads/pinnacle" 
                        className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md ${
                          isActive('/admin/uploads/pinnacle') 
                            ? 'bg-zinc-800 text-orange-400 font-medium' 
                            : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300'
                        }`}
                        onClick={toggleMobileMenu}
                      >
                        <span>Pinnacle Upload</span>
                      </Link>
                      <Link 
                        to="/admin/uploads/harley" 
                        className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md ${
                          isActive('/admin/uploads/harley') 
                            ? 'bg-zinc-800 text-orange-400 font-medium' 
                            : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300'
                        }`}
                        onClick={toggleMobileMenu}
                      >
                        <span>Harley Upload</span>
                      </Link>
                      <Link 
                        to="/admin/uploads/shopify" 
                        className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md ${
                          isActive('/admin/uploads/shopify') 
                            ? 'bg-zinc-800 text-orange-400 font-medium' 
                            : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-orange-300'
                        }`}
                        onClick={toggleMobileMenu}
                      >
                        <span>Shopify API</span>
                      </Link>
                    </div>
                  )}
                </div>
              </nav>
            </div>
          </div>
        )}

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
