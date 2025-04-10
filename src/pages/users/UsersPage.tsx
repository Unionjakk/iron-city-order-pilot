
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Trash2, UserX, Check, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const UsersPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Assuming admin email is stored in user metadata or can be checked in some way
  const isAdmin = user?.email === 'dale.gillespie@opusmotorgroup.co.uk';
  
  useEffect(() => {
    fetchUsers();
    fetchAllowedDomains();
  }, []);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // For actual production use, you would need a Supabase Edge Function
      // that uses the service role key to fetch users securely
      // For now, if we're the admin, try to fetch users (may fail due to permissions)
      if (isAdmin) {
        try {
          // In production, this would be handled through a secure edge function
          // For now, just show the current logged-in user as a fallback
          setUsers(user ? [user] : []);
        } catch (err: any) {
          console.error("Error fetching users:", err);
          
          // Fallback: Just show the current logged-in user
          setUsers(user ? [user] : []);
        }
      } else {
        // Non-admin users just see themselves
        setUsers(user ? [user] : []);
      }
    } catch (error: any) {
      console.error("Error in fetchUsers:", error);
      toast({
        title: "Error fetching users",
        description: error.message || "User not allowed",
        variant: "destructive"
      });
      
      // Set empty array to avoid showing loading state indefinitely
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAllowedDomains = () => {
    // Retrieve domains from localStorage for persistence
    const storedDomains = localStorage.getItem('allowedDomains');
    if (storedDomains) {
      try {
        const parsedDomains = JSON.parse(storedDomains);
        setDomains(Array.isArray(parsedDomains) ? parsedDomains : ['opusmotorgroup.co.uk']);
        console.log("Loaded domains from localStorage:", parsedDomains);
      } catch (error) {
        console.error("Error parsing domains from localStorage:", error);
        // Fallback to default domain
        setDomains(['opusmotorgroup.co.uk']);
        localStorage.setItem('allowedDomains', JSON.stringify(['opusmotorgroup.co.uk']));
      }
    } else {
      // Initialize with default domain and store in localStorage
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
      
      // In a production app, this would be handled via an edge function
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
  
  const addDomain = () => {
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
    
    // Add domain to list and persist in localStorage
    const updatedDomains = [...domains, newDomain];
    setDomains(updatedDomains);
    localStorage.setItem('allowedDomains', JSON.stringify(updatedDomains));
    setNewDomain('');
    
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
    
    // Don't allow removing all domains
    if (domains.length <= 1) {
      toast({
        title: "Cannot remove domain",
        description: "At least one domain must remain in the allowed list",
        variant: "destructive"
      });
      return;
    }
    
    // Remove domain from list and update localStorage
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  {isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.user_metadata?.full_name || '-'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.email_confirmed_at ? (
                        <Badge className="bg-green-600 flex items-center gap-1 text-white">
                          <Check className="h-3 w-3" /> Verified
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <X className="h-3 w-3" /> Unverified
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-orange-500">Delete User Account</AlertDialogTitle>
                              <AlertDialogDescription className="text-zinc-400">
                                Are you sure you want to delete this user account? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteUser(user.id)}
                                className="bg-red-600 text-white hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 5 : 4} className="text-center py-6 text-zinc-500">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Domain Restrictions</CardTitle>
            <CardDescription>Only allow registrations from specific email domains</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="domain.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="flex h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1"
                />
                <Button onClick={addDomain} className="bg-orange-500 hover:bg-orange-600">
                  Add Domain
                </Button>
              </div>
              
              <Separator className="bg-zinc-800" />
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-zinc-300">Allowed Domains</h3>
                {domains.length > 0 ? (
                  <ul className="space-y-2">
                    {domains.map((domain) => (
                      <li key={domain} className="flex items-center justify-between px-3 py-2 bg-zinc-800/40 rounded-md">
                        <span className="text-zinc-300">{domain}</span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100/10"
                          onClick={() => removeDomain(domain)}
                          disabled={domains.length <= 1}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-zinc-500 text-sm">No domains added yet. All email domains will be allowed to register.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UsersPage;
