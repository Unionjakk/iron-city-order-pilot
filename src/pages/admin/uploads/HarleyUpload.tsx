
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const HarleyUpload = () => {
  const navigate = useNavigate();
  
  // Redirect to the new Harley dashboard
  useEffect(() => {
    navigate('/admin/uploads/harley/dashboard');
  }, [navigate]);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">Harley Davidson Upload</h1>
        <p className="text-orange-400/80">Redirecting to import dashboard...</p>
      </div>
      
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-orange-500">Redirecting to Harley Davidson Dashboard</CardTitle>
          <CardDescription className="text-zinc-400">If you are not redirected automatically, please click the link below</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-zinc-300">The Harley Davidson Import Module allows you to upload and manage data from H-D NET.</p>
          <Link to="/admin/uploads/harley/dashboard" className="inline-flex items-center text-orange-500 hover:text-orange-400">
            Go to Harley Davidson Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default HarleyUpload;
