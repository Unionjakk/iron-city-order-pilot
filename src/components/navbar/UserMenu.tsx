
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserMenu = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };
  
  return (
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
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
};

export default UserMenu;
