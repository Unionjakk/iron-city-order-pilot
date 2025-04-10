
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Loader, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type PinnacleFileUploaderProps = {
  file: File | null;
  setFile: (file: File | null) => void;
  isUploading: boolean;
  onUpload: () => Promise<void>;
};

const PinnacleFileUploader = ({ 
  file, 
  setFile, 
  isUploading, 
  onUpload 
}: PinnacleFileUploaderProps) => {
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Check file type
      if (!selectedFile.name.endsWith('.xlsx')) {
        toast({
          title: "Invalid file format",
          description: "Please upload an Excel (.xlsx) file exported from Pinnacle.",
          variant: "destructive",
        });
        return;
      }
      
      // Check file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "The file size exceeds the 10MB limit.",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="pinnacle-file" className="text-sm font-medium text-zinc-300">
        Select Pinnacle Excel Export (.xlsx)
      </label>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center px-3 py-2 border border-zinc-700 bg-zinc-800 rounded-md">
            <FileSpreadsheet className="mr-2 h-5 w-5 text-zinc-400" />
            <span className="flex-1 truncate text-zinc-300">{file ? file.name : 'No file selected'}</span>
            <input
              id="pinnacle-file"
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => document.getElementById('pinnacle-file')?.click()}
            >
              Browse
            </Button>
          </div>
        </div>
        <Button 
          onClick={onUpload} 
          disabled={!file || isUploading}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          {isUploading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-zinc-500">Maximum file size: 10MB. File must be in Excel (.xlsx) format.</p>
    </div>
  );
};

export default PinnacleFileUploader;
