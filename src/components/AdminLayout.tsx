
import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import Footer from './Footer';

const AdminLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-black to-zinc-900">
      <NavBar />

      <main className="flex-grow container mx-auto px-4 py-6">
        <Outlet />
      </main>
      
      <Footer />
    </div>
  );
};

export default AdminLayout;
