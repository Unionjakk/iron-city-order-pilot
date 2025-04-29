
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PinnacleFileUploader from './PinnacleFileUploader';
import PinnacleStatsCard from './PinnacleStatsCard';
import PinnacleFormatHelp from './PinnacleFormatHelp';
import PinnacleDeleteButton from './PinnacleDeleteButton';

type PinnacleUploadCardProps = {
  file: File | null;
  setFile: (file: File | null) => void;
  stockCount: number | null;
  lastUpload: string | null;
  fetchStockStats: () => Promise<void>;
  isLoading: boolean;
};

const PinnacleUploadCard = ({ 
  file, 
  setFile, 
  stockCount, 
  lastUpload, 
  fetchStockStats,
  isLoading
}: PinnacleUploadCardProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a Pinnacle export file to upload.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("This will replace all existing stock data. Continue?")) {
      return;
    }

    setIsUploading(true);
    
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Use the Supabase Edge Function endpoint with proper authorization header
      const response = await fetch('https://hbmismnzmocjazaiicdu.supabase.co/functions/v1/pinnacle-upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhibWlzbW56bW9jamF6YWlpY2R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyNjk1MDcsImV4cCI6MjA1OTg0NTUwN30.gnCYxUmbL0nZMmmiZp641fkEjv7bbitUNIFK2LMjMXE',
        },
        body: formData,
      });
      
      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received non-JSON response from server');
      }
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }
      
      toast({
        title: "Upload successful",
        description: `Successfully imported ${result.recordsCount} stock items from Pinnacle.`,
        variant: "default",
      });
      
      // Refresh stats
      fetchStockStats();
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('pinnacle-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("This will permanently delete all stock data. This action cannot be undone. Continue?")) {
      return;
    }

    setIsDeleting(true);
    
    try {
      // Delete all records directly
      const { error } = await supabase
        .from('pinnacle_stock')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) throw error;
      
      toast({
        title: "Data deleted",
        description: "Successfully deleted all stock data.",
        variant: "default",
      });
      
      // Refresh stats
      fetchStockStats();
      
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: "An error occurred while deleting stock data.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-orange-500">Upload Stock Data</CardTitle>
        <CardDescription className="text-zinc-400">Import inventory data from Pinnacle Excel export</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <PinnacleFileUploader 
            file={file} 
            setFile={setFile} 
            isUploading={isUploading} 
            onUpload={handleUpload} 
          />
          
          <PinnacleStatsCard 
            stockCount={stockCount} 
            lastUpload={lastUpload}
            isLoading={isLoading}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t border-zinc-800 pt-4">
        <PinnacleFormatHelp />
        
        <PinnacleDeleteButton 
          isDeleting={isDeleting} 
          stockCount={stockCount} 
          onDelete={handleDelete} 
        />
      </CardFooter>
    </Card>
  );
};

export default PinnacleUploadCard;
