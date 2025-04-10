
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileText, Info, AlertTriangle, X } from 'lucide-react';
import { Code } from '@/components/ui/code';

const OrderLinesUpload = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    
    const newFiles = Array.from(selectedFiles);
    setFiles(prev => [...prev, ...newFiles]);
  };
  
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    // File upload logic would go here
    
    // Simulating upload delay
    setTimeout(() => {
      setIsUploading(false);
      setFiles([]);
      // Alert would show upload result
    }, 2000);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">Upload Harley Davidson Order Line Items</h1>
        <p className="text-orange-400/80">Import detailed part information for orders</p>
      </div>
      
      {/* Instructions Card */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-500">
            <Info className="mr-2 h-5 w-5" />
            Instructions
          </CardTitle>
          <CardDescription className="text-zinc-400">How to download and prepare Order Line Items files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-orange-400">Downloading Order Line Items from H-D NET:</h3>
            <ol className="list-decimal list-inside space-y-2 text-zinc-300">
              <li>Log in to the H-D NET system</li>
              <li>Navigate to "ORDER INQUIRY"</li>
              <li>Select "ORDER LINE ITEMS" tab</li>
              <li>Enter the HD Order Number in the "Sales Order Number" field</li>
              <li>Click the search icon</li>
              <li>Ensure "Both" is selected under "SHOW" options</li>
              <li>Click the export icon in the top-right section of the order lines grid</li>
              <li>Save the Excel file to your computer</li>
              <li>Repeat for each HD Order Number needing import</li>
            </ol>
            
            <div className="mt-6 p-4 bg-zinc-800/60 rounded-lg border border-zinc-700">
              <h3 className="flex items-center font-medium text-orange-400 mb-2">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Important Notes:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-zinc-300">
                <li>You can upload multiple Order Line Items files at once</li>
                <li>Each file should contain data for a single HD Order Number</li>
                <li>Do not modify the exported files before uploading</li>
                <li>Uploading line items for an HD Order will replace any existing line items for that order</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Upload Card */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-500">
            <FileText className="mr-2 h-5 w-5" />
            File Upload
          </CardTitle>
          <CardDescription className="text-zinc-400">Upload H-D NET Order Line Items export files</CardDescription>
        </CardHeader>
        <CardContent>
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
                  onChange={handleFileChange}
                  disabled={isUploading}
                  multiple
                />
              </label>
            </div>
            
            {/* File List */}
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
                        onClick={() => removeFile(index)}
                        className="p-1 rounded-full hover:bg-zinc-700"
                        disabled={isUploading}
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
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {isUploading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Uploading {files.length} file{files.length !== 1 ? 's' : ''}...
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
        </CardContent>
        <CardFooter className="border-t border-zinc-800 bg-zinc-900/30">
          <div className="w-full text-xs text-zinc-400">
            <p>Expected file format for each Order Line Items file:</p>
            <Code className="mt-2">
              HD ORDER NUMBER | LINE NUMBER | PART NUMBER | DESCRIPTION | ORDER QUANTITY | OPEN QUANTITY | UNIT PRICE | TOTAL PRICE | STATUS | PO NUMBER | ORDER DATE
            </Code>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OrderLinesUpload;
