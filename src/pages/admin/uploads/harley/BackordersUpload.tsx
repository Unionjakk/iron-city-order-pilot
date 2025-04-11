
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, Truck, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Code } from '@/components/ui/code';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const parseExcelFile = async (file: File): Promise<any[]> => {
  console.log('Parsing file:', file.name);
  return Promise.resolve([
    { 
      hd_order_number: 'HD-' + Math.floor(Math.random() * 1000000), 
      line_number: Math.floor(Math.random() * 100),
      dealer_po_number: 'PO-' + Math.floor(Math.random() * 10000),
      order_date: new Date().toISOString(),
      backorder_clear_by: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Sample Part',
      part_number: 'PT-' + Math.floor(Math.random() * 10000),
      quantity: Math.floor(Math.random() * 10) + 1,
      projected_shipping_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      projected_shipping_quantity: Math.floor(Math.random() * 5) + 1,
      total_price: Math.random() * 500
    },
    { 
      hd_order_number: 'HD-' + Math.floor(Math.random() * 1000000), 
      line_number: Math.floor(Math.random() * 100),
      dealer_po_number: 'PO-' + Math.floor(Math.random() * 10000),
      order_date: new Date().toISOString(),
      backorder_clear_by: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Sample Part',
      part_number: 'PT-' + Math.floor(Math.random() * 10000),
      quantity: Math.floor(Math.random() * 10) + 1,
      projected_shipping_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      projected_shipping_quantity: Math.floor(Math.random() * 5) + 1,
      total_price: Math.random() * 500
    }
  ]);
};

const BackordersUpload = () => {
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
      console.log('Starting to parse Excel file...');
      const parsedData = await parseExcelFile(file);
      console.log('Parsed data:', parsedData);
      
      if (parsedData.length === 0) {
        console.warn('No data found in file');
        toast.error('No data found in the uploaded file');
        setIsUploading(false);
        setIsProcessing(false);
        return;
      }
      
      // First, clear existing backorder flags
      console.log('Resetting existing backorder flags...');
      const { error: resetError } = await supabase
        .from('hd_order_line_items')
        .update({ 
          is_backorder: false,
          backorder_clear_by: null,
          projected_shipping_date: null,
          projected_shipping_quantity: null
        })
        .eq('is_backorder', true);
      
      if (resetError) {
        console.error('Error resetting backorder flags:', resetError);
        toast.error('Failed to reset existing backorder data');
        setIsUploading(false);
        setIsProcessing(false);
        return;
      }
      
      console.log('Processing backorder data...');
      let successCount = 0;
      let errorCount = 0;
      
      // Process each backorder item
      for (const item of parsedData) {
        // Find the matching line item
        const { data: lineItems, error: findError } = await supabase
          .from('hd_order_line_items')
          .select('id')
          .eq('hd_order_number', item.hd_order_number)
          .eq('line_number', item.line_number)
          .eq('part_number', item.part_number);
        
        if (findError) {
          console.error('Error finding line item:', findError);
          errorCount++;
          continue;
        }
        
        if (!lineItems || lineItems.length === 0) {
          console.warn(`No matching line item found for order ${item.hd_order_number}, line ${item.line_number}, part ${item.part_number}`);
          errorCount++;
          continue;
        }
        
        // Update the line item with backorder information
        const { error: updateError } = await supabase
          .from('hd_order_line_items')
          .update({
            is_backorder: true,
            backorder_clear_by: item.backorder_clear_by || null,
            projected_shipping_date: item.projected_shipping_date || null,
            projected_shipping_quantity: item.projected_shipping_quantity || 0
          })
          .eq('id', lineItems[0].id);
        
        if (updateError) {
          console.error('Error updating line item:', updateError);
          errorCount++;
          continue;
        }
        
        successCount++;
      }
      
      // Record upload history
      const { error: historyError } = await supabase
        .from('hd_upload_history')
        .insert({
          upload_type: 'backorders',
          filename: file.name,
          items_count: parsedData.length,
          status: errorCount === 0 ? 'success' : 'partial',
          replaced_previous: true
        });
      
      if (historyError) {
        console.error('Error recording upload history:', historyError);
      }
      
      console.log('Upload completed with results:', { successCount, errorCount });
      
      if (errorCount === 0) {
        toast.success(`Successfully processed ${successCount} backorder items`);
      } else {
        toast.warning(`Processed ${successCount} items with ${errorCount} errors`);
      }
      
      setUploadSuccess(true);
      setIsProcessing(false);
      
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
        <h1 className="text-2xl font-bold text-orange-500">Upload Harley Davidson Backorder Report</h1>
        <p className="text-orange-400/80">Import backorder status information</p>
      </div>
      
      {/* Instructions Card */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-500">
            <Info className="mr-2 h-5 w-5" />
            Instructions
          </CardTitle>
          <CardDescription className="text-zinc-400">How to download and prepare the Backorder Report file</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-orange-400">Downloading Backorder Report from H-D NET:</h3>
            <ol className="list-decimal list-inside space-y-2 text-zinc-300">
              <li>Log in to the H-D NET system</li>
              <li>Navigate to "ORDER INQUIRY"</li>
              <li>Select "BACKORDER REPORT" tab</li>
              <li>Set any date filters if needed (optional)</li>
              <li>Click the search icon</li>
              <li>Click the export icon in the top-right section of the backorder grid</li>
              <li>Save the Excel file to your computer</li>
            </ol>
            
            <div className="mt-6 p-4 bg-zinc-800/60 rounded-lg border border-zinc-700">
              <h3 className="flex items-center font-medium text-orange-400 mb-2">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Important Notes:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-zinc-300">
                <li>Do not modify the exported file before uploading</li>
                <li>This upload will replace any previous backorder data</li>
                <li>The system will cross-reference backorder data with order line items</li>
                <li>Any discrepancies between the backorder report and order line items will be flagged</li>
                <li>This report should ideally be uploaded after Open Orders and Order Line Items</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Upload Card */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-500">
            <Truck className="mr-2 h-5 w-5" />
            File Upload
          </CardTitle>
          <CardDescription className="text-zinc-400">Upload H-D NET Backorder Report export file</CardDescription>
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
                        <Truck className="w-10 h-10 mb-3 text-orange-500" />
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
                      Upload Backorder Report
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
              HD ORDER NUMBER | LINE NUMBER | PO NUMBER | ORDER DATE | BACKORDER CLEAR BY | DESCRIPTION | PART NUMBER | QUANTITY | PROJECTED SHIPPING DATE | PROJECTED SHIPPING QUANTITY | TOTAL PRICE
            </Code>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BackordersUpload;
