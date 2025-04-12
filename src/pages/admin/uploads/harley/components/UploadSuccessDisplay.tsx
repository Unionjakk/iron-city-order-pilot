
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface UploadStats {
  processed: number;
  replaced: number;
  errors: number;
}

interface UploadSuccessDisplayProps {
  stats: UploadStats;
}

const UploadSuccessDisplay = ({ stats }: UploadSuccessDisplayProps) => {
  return (
    <div className="flex flex-col items-center p-6 text-center">
      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
        <CheckCircle className="h-8 w-8 text-green-500" />
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2">Upload Complete!</h3>
      <p className="text-zinc-400 mb-4">File processing completed successfully</p>
      
      <div className="grid grid-cols-3 gap-4 w-full max-w-md mb-6">
        <div className="bg-zinc-800 p-3 rounded-lg">
          <p className="text-2xl font-bold text-green-400">{stats.processed}</p>
          <p className="text-xs text-zinc-400">Items Processed</p>
        </div>
        <div className="bg-zinc-800 p-3 rounded-lg">
          <p className="text-2xl font-bold text-amber-400">{stats.replaced}</p>
          <p className="text-xs text-zinc-400">Items Replaced</p>
        </div>
        <div className="bg-zinc-800 p-3 rounded-lg">
          <p className="text-2xl font-bold text-red-400">{stats.errors}</p>
          <p className="text-xs text-zinc-400">Errors</p>
        </div>
      </div>
      
      <div className="flex gap-3">
        <Link to="/admin/uploads/harley/dashboard">
          <Button variant="outline" className="border-zinc-700 text-zinc-300">
            Go to Dashboard
          </Button>
        </Link>
        <Link to="/admin/uploads/harley">
          <Button className="bg-orange-500 hover:bg-orange-600">
            Upload More Files
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default UploadSuccessDisplay;
