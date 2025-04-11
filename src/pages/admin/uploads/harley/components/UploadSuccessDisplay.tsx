
import { CheckCircle2 } from 'lucide-react';

interface UploadSuccessDisplayProps {
  stats: {
    processed: number;
    replaced: number;
    errors: number;
  };
}

const UploadSuccessDisplay = ({ stats }: UploadSuccessDisplayProps) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-64 bg-green-900/20 border-2 border-green-500 rounded-lg">
      <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
      <p className="text-green-400 text-lg font-semibold">Upload Successful!</p>
      <div className="flex flex-col items-center mt-3">
        <p className="text-zinc-300">Processed: <span className="text-green-400 font-medium">{stats.processed}</span> items</p>
        {stats.replaced > 0 && (
          <p className="text-zinc-300">Replaced: <span className="text-amber-400 font-medium">{stats.replaced}</span> items</p>
        )}
        {stats.errors > 0 && (
          <p className="text-zinc-300">Errors: <span className="text-red-400 font-medium">{stats.errors}</span></p>
        )}
      </div>
      <p className="text-zinc-300 mt-2">Redirecting to dashboard...</p>
    </div>
  );
};

export default UploadSuccessDisplay;
