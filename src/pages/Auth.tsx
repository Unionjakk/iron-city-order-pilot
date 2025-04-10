
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      toast({
        title: 'Error signing in',
        description: error instanceof Error ? error.message : 'Please check your credentials and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signUp(email, password, fullName);
      if (error) throw error;
      
      toast({
        title: 'Account created',
        description: 'Please check your email to confirm your account.',
      });
    } catch (error) {
      console.error('Error signing up:', error);
      toast({
        title: 'Error signing up',
        description: error instanceof Error ? error.message : 'Please check your information and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="absolute inset-0 bg-[url('/placeholder.svg')] bg-cover opacity-5 pointer-events-none"></div>
      
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-orange-800">Iron City Shopify</h1>
            <p className="text-orange-600 mt-2">Order Management System</p>
          </div>
          
          <Card className="border-orange-200 shadow-lg">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-orange-50">
                <TabsTrigger value="signin" className="data-[state=active]:bg-white">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-white">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn}>
                  <CardHeader>
                    <CardTitle className="text-orange-800">Welcome back</CardTitle>
                    <CardDescription>Enter your credentials to access your account</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com" 
                        required 
                        className="border-orange-200 focus-visible:ring-orange-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                        className="border-orange-200 focus-visible:ring-orange-500"
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp}>
                  <CardHeader>
                    <CardTitle className="text-orange-800">Create an account</CardTitle>
                    <CardDescription>Enter your details to create your account</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input 
                        id="fullName" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe" 
                        required 
                        className="border-orange-200 focus-visible:ring-orange-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signupEmail">Email</Label>
                      <Input 
                        id="signupEmail" 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com" 
                        required 
                        className="border-orange-200 focus-visible:ring-orange-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signupPassword">Password</Label>
                      <Input 
                        id="signupPassword" 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                        className="border-orange-200 focus-visible:ring-orange-500"
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      {loading ? 'Creating Account...' : 'Sign Up'}
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </main>
      
      <footer className="py-4 text-center text-orange-600 bg-orange-50 border-t border-orange-200">
        <p>© {new Date().getFullYear()} Iron City Shopify. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Auth;
