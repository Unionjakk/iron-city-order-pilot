
import { UploadCloud, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadZoneProps {
  files: File[];
  isUploading: boolean;
  isProcessing: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onUpload: () => void;
}

const FileUploadZone = ({
  files,
  isUploading,
  isProcessing,
  onFileChange,
  onRemoveFile,
  onUpload
}: FileUploadZoneProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label 
          htmlFor="dropzone-file" 
          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className="w-10 h-10 mb-3 text-zinc-400" />
            <p className="mb-2 text-sm text-zinc-300">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-zinc-400">Excel files only (.xls, .xlsx)</p>
            <p className="mt-2 text-xs text-orange-400">Multiple files supported</p>
          </div>
          <input 
            id="dropzone-file" 
            type="file" 
            className="hidden" 
            accept=".xls,.xlsx" 
            onChange={onFileChange}
            disabled={isUploading || isProcessing}
            multiple
          />
        </label>
      </div>
      
      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-zinc-300 mb-2">Files to upload ({files.length}):</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-zinc-800 rounded">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-orange-400 mr-2" />
                  <div>
                    <p className="text-sm text-zinc-200">{file.name}</p>
                    <p className="text-xs text-zinc-400">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <button 
                  onClick={() => onRemoveFile(index)}
                  className="p-1 rounded-full hover:bg-zinc-700"
                  disabled={isUploading || isProcessing}
                >
                  <X className="h-4 w-4 text-zinc-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {files.length > 0 && (
        <div className="flex justify-center mt-4">
          <Button
            onClick={onUpload}
            disabled={isUploading || isProcessing}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isProcessing ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Processing {files.length} file{files.length !== 1 ? 's' : ''}...
              </>
            ) : (
              <>
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload {files.length} file{files.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;
