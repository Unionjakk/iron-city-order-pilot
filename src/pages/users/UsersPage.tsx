
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import UserTable from './components/UserTable';
import DomainManagement from './components/DomainManagement';

const UsersPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // All authenticated users are admins
  const isAdmin = !!user;
  
  useEffect(() => {
    fetchUsers();
    fetchAllowedDomains();
  }, []);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      if (isAdmin) {
        const { data, error } = await supabase.functions.invoke('fetch-users');
        
        if (error) throw error;
        if (data.users) {
          setUsers(data.users);
        }
      } else {
        setUsers(user ? [user] : []);
      }
    } catch (error: any) {
      console.error("Error in fetchUsers:", error);
      toast({
        title: "Error fetching users",
        description: error.message || "Failed to fetch users",
        variant: "destructive"
      });
      
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAllowedDomains = () => {
    const storedDomains = localStorage.getItem('allowedDomains');
    if (storedDomains) {
      try {
        const parsedDomains = JSON.parse(storedDomains);
        setDomains(Array.isArray(parsedDomains) ? parsedDomains : ['opusmotorgroup.co.uk']);
        console.log("Loaded domains from localStorage:", parsedDomains);
      } catch (error) {
        console.error("Error parsing domains from localStorage:", error);
        setDomains(['opusmotorgroup.co.uk']);
        localStorage.setItem('allowedDomains', JSON.stringify(['opusmotorgroup.co.uk']));
      }
    } else {
      const defaultDomains = ['opusmotorgroup.co.uk'];
      setDomains(defaultDomains);
      localStorage.setItem('allowedDomains', JSON.stringify(defaultDomains));
    }
  };
  
  const deleteUser = async (userId: string) => {
    try {
      if (!isAdmin) {
        toast({
          title: "Permission denied",
          description: "Only administrators can delete users",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Action not available",
        description: "User deletion requires a secure edge function in production.",
        variant: "destructive"
      });
    } catch (error: any) {
      toast({
        title: "Error deleting user",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const addDomain = (newDomain: string) => {
    if (!isAdmin) {
      toast({
        title: "Permission denied",
        description: "Only administrators can manage allowed domains",
        variant: "destructive"
      });
      return;
    }
    
    if (!newDomain) {
      toast({
        title: "Invalid domain",
        description: "Please enter a valid domain",
        variant: "destructive"
      });
      return;
    }
    
    const updatedDomains = [...domains, newDomain];
    setDomains(updatedDomains);
    localStorage.setItem('allowedDomains', JSON.stringify(updatedDomains));
    
    toast({
      title: "Domain added",
      description: `${newDomain} has been added to allowed domains`,
    });
  };
  
  const removeDomain = (domain: string) => {
    if (!isAdmin) {
      toast({
        title: "Permission denied",
        description: "Only administrators can manage allowed domains",
        variant: "destructive"
      });
      return;
    }
    
    if (domains.length <= 1) {
      toast({
        title: "Cannot remove domain",
        description: "At least one domain must remain in the allowed list",
        variant: "destructive"
      });
      return;
    }
    
    const updatedDomains = domains.filter(d => d !== domain);
    setDomains(updatedDomains);
    localStorage.setItem('allowedDomains', JSON.stringify(updatedDomains));
    
    toast({
      title: "Domain removed",
      description: `${domain} has been removed from allowed domains`,
    });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">User Management</h1>
        <p className="text-orange-400/80">Manage user accounts and registration restrictions</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>User Accounts</CardTitle>
          <CardDescription>All registered users in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-4">
              <div className="h-8 w-8 border-4 border-orange-500 border-r-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <UserTable users={users} isAdmin={isAdmin} onDeleteUser={deleteUser} />
          )}
        </CardContent>
      </Card>
      
      {isAdmin && (
        <DomainManagement 
          domains={domains}
          onAddDomain={addDomain}
          onRemoveDomain={removeDomain}
        />
      )}
    </div>
  );
};

export default UsersPage;
