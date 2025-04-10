
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileSpreadsheet, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Code } from '@/components/ui/code';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// This is a placeholder for actual Excel parsing logic
// In a real implementation, you would use a library like SheetJS/xlsx
const parseExcelFile = async (file: File): Promise<any[]> => {
  // Mock implementation - in a real app, this would parse the Excel file
  console.log('Parsing file:', file.name);
  
  // Return a mock array of data
  return Promise.resolve([
    { 
      hd_order_number: 'HD-' + Math.floor(Math.random() * 1000000), 
      dealer_po_number: 'PO-' + Math.floor(Math.random() * 10000),
      order_date: new Date().toISOString(),
      total_price: Math.random() * 1000,
      ship_to: 'Iron City Harley',
      order_type: 'Regular',
      terms: 'Net 30',
      notes: 'Sample order'
    },
    { 
      hd_order_number: 'HD-' + Math.floor(Math.random() * 1000000), 
      dealer_po_number: 'PO-' + Math.floor(Math.random() * 10000),
      order_date: new Date().toISOString(),
      total_price: Math.random() * 1000,
      ship_to: 'Iron City Harley',
      order_type: 'Regular',
      terms: 'Net 30',
      notes: 'Sample order'
    }
  ]);
};

const OpenOrdersUpload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setUploadSuccess(false);
  };
  
  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }
    
    setIsUploading(true);
    setIsProcessing(true);
    
    try {
      // Step 1: Parse the Excel file
      console.log('Starting to parse Excel file...');
      const parsedData = await parseExcelFile(file);
      console.log('Parsed data:', parsedData);
      
      // Step 2: Clear existing open orders (if this is a full replacement)
      // In a real implementation, you might want to ask for confirmation first
      console.log('Clearing existing open orders...');
      const { error: clearError } = await supabase
        .from('hd_orders')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // This will delete all rows
      
      if (clearError) {
        console.error('Error clearing existing orders:', clearError);
        toast.error('Failed to clear existing orders');
        setIsUploading(false);
        setIsProcessing(false);
        return;
      }
      
      // Step 3: Insert new order data
      console.log('Inserting new order data...');
      const { error: insertError } = await supabase
        .from('hd_orders')
        .insert(parsedData.map(order => ({
          hd_order_number: order.hd_order_number,
          dealer_po_number: order.dealer_po_number,
          order_date: order.order_date,
          total_price: order.total_price,
          ship_to: order.ship_to,
          order_type: order.order_type,
          terms: order.terms,
          notes: order.notes,
          has_line_items: false // Initially, no orders have line items
        })));
      
      if (insertError) {
        console.error('Error inserting orders:', insertError);
        toast.error('Failed to insert new orders');
        setIsUploading(false);
        setIsProcessing(false);
        return;
      }
      
      // Step 4: Record the upload in history
      console.log('Recording upload history...');
      const { error: historyError } = await supabase
        .from('hd_upload_history')
        .insert({
          upload_type: 'open_orders',
          filename: file.name,
          items_count: parsedData.length,
          status: 'success',
          replaced_previous: true
        });
      
      if (historyError) {
        console.error('Error recording upload history:', historyError);
        // This is non-critical, so we'll just log it
      }
      
      // Success!
      console.log('Upload completed successfully!');
      toast.success(`Successfully uploaded ${parsedData.length} orders`);
      setUploadSuccess(true);
      setIsProcessing(false);
      
      // After 3 seconds, navigate back to the dashboard
      setTimeout(() => {
        navigate('/admin/uploads/harley/dashboard');
      }, 3000);
      
    } catch (error) {
      console.error('Error processing upload:', error);
      toast.error('An error occurred during processing');
      setIsUploading(false);
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">Upload Harley Davidson Open Orders</h1>
        <p className="text-orange-400/80">Import order information from H-D NET Open Orders screen</p>
      </div>
      
      {/* Instructions Card */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-500">
            <Info className="mr-2 h-5 w-5" />
            Instructions
          </CardTitle>
          <CardDescription className="text-zinc-400">How to download and prepare the Open Orders file</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-orange-400">Downloading Open Orders List from H-D NET:</h3>
            <ol className="list-decimal list-inside space-y-2 text-zinc-300">
              <li>Log in to the H-D NET system</li>
              <li>Navigate to "ORDER INQUIRY"</li>
              <li>Select "OPEN ORDERS" tab</li>
              <li>Set filter options if needed (or use "Show All Orders")</li>
              <li>Click the export icon in the top-right section of the orders grid</li>
              <li>Save the Excel file to your computer</li>
            </ol>
            
            <div className="mt-6 p-4 bg-zinc-800/60 rounded-lg border border-zinc-700">
              <h3 className="flex items-center font-medium text-orange-400 mb-2">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Important Notes:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-zinc-300">
                <li>Do not modify the exported file before uploading</li>
                <li>Make sure the file contains all necessary columns including HD Order Number and PO Number</li>
                <li>This upload will replace any previous Open Orders data</li>
                <li>After upload, you should proceed to uploading the Order Line Items for each order</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Upload Card */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-500">
            <FileSpreadsheet className="mr-2 h-5 w-5" />
            File Upload
          </CardTitle>
          <CardDescription className="text-zinc-400">Upload H-D NET Open Orders export file</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {uploadSuccess ? (
              <div className="flex flex-col items-center justify-center w-full h-64 bg-green-900/20 border-2 border-green-500 rounded-lg">
                <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                <p className="text-green-400 text-lg font-semibold">Upload Successful!</p>
                <p className="text-zinc-300 mt-2">Redirecting to dashboard...</p>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <label 
                  htmlFor="dropzone-file" 
                  className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer ${
                    file ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {file ? (
                      <>
                        <FileSpreadsheet className="w-10 h-10 mb-3 text-orange-500" />
                        <p className="mb-2 text-sm text-zinc-200 font-semibold">{file.name}</p>
                        <p className="text-xs text-zinc-400">{(file.size / 1024).toFixed(2)} KB</p>
                        <p className="mt-2 text-xs text-orange-400">File ready for upload</p>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-10 h-10 mb-3 text-zinc-400" />
                        <p className="mb-2 text-sm text-zinc-300">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-zinc-400">Excel files only (.xls, .xlsx)</p>
                      </>
                    )}
                  </div>
                  <input 
                    id="dropzone-file" 
                    type="file" 
                    className="hidden" 
                    accept=".xls,.xlsx" 
                    onChange={handleFileChange}
                    disabled={isUploading || isProcessing}
                  />
                </label>
              </div>
            )}
            
            {file && !uploadSuccess && (
              <div className="flex justify-center mt-4">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || isProcessing}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {isProcessing ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Upload Open Orders
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t border-zinc-800 bg-zinc-900/30">
          <div className="w-full text-xs text-zinc-400">
            <p>Expected file format:</p>
            <Code className="mt-2">
              HD ORDER NUMBER | PO NUMBER | ORDER DATE | TOTAL PRICE | SHIP TO | ORDER TYPE | TERMS | NOTES
            </Code>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OpenOrdersUpload;
