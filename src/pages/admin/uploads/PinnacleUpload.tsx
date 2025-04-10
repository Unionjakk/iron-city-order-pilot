import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { Upload, Trash2, FileSpreadsheet, Info, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const PinnacleUpload = () => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [stockCount, setStockCount] = useState<number | null>(null);
  const [lastUpload, setLastUpload] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch stock data stats on component mount
  const fetchStockStats = async () => {
    try {
      // Get count of stock items using execute_sql function
      const { data: countData, error: countError } = await supabase
        .rpc('execute_sql', { sql: 'SELECT COUNT(*) as count FROM pinnacle_stock' });
      
      if (countError) throw countError;
      if (countData && countData.length > 0) {
        // Access 'count' from the first row of the result
        const countValue = countData[0]?.count;
        setStockCount(typeof countValue === 'number' ? countValue : parseInt(countValue));
      } else {
        setStockCount(0);
      }
      
      // Get most recent upload using execute_sql function
      const { data: uploadHistory, error: historyError } = await supabase
        .rpc('execute_sql', { 
          sql: 'SELECT upload_timestamp FROM pinnacle_upload_history ORDER BY upload_timestamp DESC LIMIT 1' 
        });
      
      if (historyError) throw historyError;
      if (uploadHistory && uploadHistory.length > 0) {
        const timestamp = uploadHistory[0]?.upload_timestamp;
        if (timestamp) {
          setLastUpload(new Date(timestamp).toLocaleString());
        }
      }
    } catch (error) {
      console.error('Error fetching stock stats:', error);
    }
  };

  // Call fetchStockStats on component mount
  useEffect(() => {
    fetchStockStats();
  }, []);

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
      
      // Use the Supabase Edge Function endpoint
      const response = await fetch('https://hbmismnzmocjazaiicdu.supabase.co/functions/v1/pinnacle-upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }
      
      const result = await response.json();
      
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
      // Use execute_sql function to delete all records
      const { error } = await supabase
        .rpc('execute_sql', { sql: 'DELETE FROM pinnacle_stock' });
      
      if (error) throw error;
      
      toast({
        title: "Data deleted",
        description: "Successfully deleted all stock data.",
        variant: "default",
      });
      
      // Refresh stats
      setStockCount(0);
      
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">Pinnacle Stock Upload</h1>
        <p className="text-orange-400/80">Import inventory data from Pinnacle system</p>
      </div>
      
      {/* Pinnacle Settings Card */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-orange-500">Pinnacle Settings</CardTitle>
          <CardDescription className="text-zinc-400">Reference for generating the correct export file</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center mb-4">
            <img 
              src="/lovable-uploads/a5bbc25d-4af3-4a7d-89c6-ecb810d397ea.png" 
              alt="Pinnacle Export Settings" 
              className="max-w-full h-auto rounded-lg border border-zinc-700 shadow-md" 
            />
          </div>
          
          <div className="mt-6 p-4 bg-zinc-800/60 rounded-lg border border-zinc-700">
            <h3 className="font-medium text-orange-400 mb-2 flex items-center gap-2">
              <Info className="h-5 w-5" /> 
              How to Generate Pinnacle Export
            </h3>
            <ol className="list-decimal pl-5 space-y-2 text-zinc-300">
              <li>Log in to Pinnacle system</li>
              <li>Navigate to the "Valuation Report" section</li>
              <li>Select "Parts" as the report type</li>
              <li>Do not filter by Product Group (leave as "Please Select...")</li>
              <li>Ensure all columns are visible (Part No, Prod Group, Description, Bin Locations, Stock Holding, and all cost/retail columns)</li>
              <li>Generate the report</li>
              <li>Export to Excel format</li>
            </ol>
          </div>
        </CardContent>
      </Card>
      
      {/* File Upload Card */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-orange-500">Upload Stock Data</CardTitle>
          <CardDescription className="text-zinc-400">Import inventory data from Pinnacle Excel export</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
                  onClick={handleUpload} 
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
            
            <div className="mt-8 p-4 bg-zinc-800/60 rounded-lg border border-zinc-700">
              <h3 className="font-medium text-orange-400 mb-2">Current Data Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-zinc-400 text-sm">Stock Items:</span>
                  <span className="ml-2 text-zinc-200 font-semibold">{stockCount !== null ? stockCount.toLocaleString() : 'Loading...'}</span>
                </div>
                <div>
                  <span className="text-zinc-400 text-sm">Last Upload:</span>
                  <span className="ml-2 text-zinc-200 font-semibold">{lastUpload || 'None'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-zinc-800 pt-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Info className="mr-2 h-4 w-4" />
                View Excel Format
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[90%] sm:max-w-xl">
              <SheetHeader>
                <SheetTitle className="text-orange-500">Required Excel Format</SheetTitle>
                <SheetDescription className="text-zinc-400">
                  Your Pinnacle export should match this format
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <img 
                  src="/lovable-uploads/839e8ad6-7bed-4564-9527-a55ca404f5ab.png" 
                  alt="Pinnacle Excel Format Example" 
                  className="max-w-full h-auto rounded-lg border border-zinc-700" 
                />
                <div className="mt-4 p-3 bg-zinc-800 rounded border border-zinc-700">
                  <h4 className="text-orange-400 font-medium text-sm mb-2">Required Columns</h4>
                  <ul className="list-disc pl-5 text-sm text-zinc-300 space-y-1">
                    <li>Part No - Unique identifier for the part</li>
                    <li>Prod Group - Product category classification</li>
                    <li>Description - Part description text</li>
                    <li>Bin Locations - Storage location</li>
                    <li>Stock Holding - Quantity currently in stock</li>
                    <li>Av Cost - Average cost per unit</li>
                    <li>Tot Av Cost - Total average cost</li>
                    <li>Cost - Current cost per unit</li>
                    <li>Tot Cost - Total current cost</li>
                    <li>Retail - Retail price per unit</li>
                    <li>Tot Retail - Total retail value</li>
                  </ul>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting || stockCount === 0}
          >
            {isDeleting ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All Stock Data
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Additional Information */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-orange-500">Important Notes</CardTitle>
          <CardDescription className="text-zinc-400">About inventory synchronization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-medium text-zinc-300">Automatic Replacement</h3>
                <p className="text-sm text-zinc-400">Each upload will completely replace the existing stock data. This ensures you always have the most up-to-date inventory information.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-medium text-zinc-300">Data Validation</h3>
                <p className="text-sm text-zinc-400">The system validates the file format and required columns before processing. This helps prevent errors in your inventory data.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <AlertCircle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-medium text-zinc-300">Regular Updates</h3>
                <p className="text-sm text-zinc-400">For accurate order processing, it's recommended to upload fresh inventory data at least daily, or whenever significant inventory changes occur.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PinnacleUpload;
