
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: { user: User | null; session: Session | null };
  }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{
    error: Error | null;
    data: { user: User | null; session: Session | null };
  }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Allowed email domains - in a real app this would be fetched from the database
const ALLOWED_DOMAINS = ['opusmotorgroup.co.uk'];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const setupAuth = async () => {
      try {
        // Check for existing session first
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, newSession) => {
            console.log("Auth state changed:", event, newSession?.user?.id);
            setSession(newSession);
            setUser(newSession?.user ?? null);
          }
        );
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Auth setup error:", error);
      } finally {
        setLoading(false);
      }
    };

    setupAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (response.error) {
      toast({
        title: "Login failed",
        description: response.error.message,
        variant: "destructive"
      });
    } else if (response.data.session) {
      toast({
        title: "Login successful",
        description: `Welcome back, ${response.data.user?.user_metadata?.full_name || 'User'}!`,
      });
      navigate('/');
    }

    return response;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    // Check if email domain is allowed
    const domain = email.split('@')[1];
    const isDomainAllowed = ALLOWED_DOMAINS.includes(domain);
    
    if (!isDomainAllowed) {
      toast({
        title: "Registration failed",
        description: `Email domain ${domain} is not allowed to register.`,
        variant: "destructive"
      });
      
      return {
        error: new Error(`Email domain ${domain} is not allowed to register.`),
        data: { user: null, session: null }
      };
    }
    
    const response = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (response.error) {
      toast({
        title: "Registration failed",
        description: response.error.message,
        variant: "destructive"
      });
    } else if (response.data.session) {
      toast({
        title: "Registration successful",
        description: "Your account has been created. Welcome!",
      });
      navigate('/');
    } else {
      toast({
        title: "Registration successful",
        description: "Please check your email to confirm your account.",
      });
    }

    return response;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out."
    });
    navigate('/auth');
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
