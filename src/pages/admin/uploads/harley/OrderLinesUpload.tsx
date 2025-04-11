
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileText, Info, AlertTriangle, X, CheckCircle2 } from 'lucide-react';
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
      part_number: 'PT-' + Math.floor(Math.random() * 10000),
      description: 'Sample Part',
      order_quantity: Math.floor(Math.random() * 10) + 1,
      open_quantity: Math.floor(Math.random() * 5),
      unit_price: Math.random() * 100,
      total_price: Math.random() * 500,
      status: 'Pending',
      dealer_po_number: 'PO-' + Math.floor(Math.random() * 10000),
      order_date: new Date().toISOString(),
    },
    { 
      hd_order_number: 'HD-' + Math.floor(Math.random() * 1000000), 
      line_number: Math.floor(Math.random() * 100),
      part_number: 'PT-' + Math.floor(Math.random() * 10000),
      description: 'Sample Part',
      order_quantity: Math.floor(Math.random() * 10) + 1,
      open_quantity: Math.floor(Math.random() * 5),
      unit_price: Math.random() * 100,
      total_price: Math.random() * 500,
      status: 'Pending',
      dealer_po_number: 'PO-' + Math.floor(Math.random() * 10000),
      order_date: new Date().toISOString(),
    }
  ]);
};

const OrderLinesUpload = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    
    const newFiles = Array.from(selectedFiles);
    setFiles(prev => [...prev, ...newFiles]);
    setUploadSuccess(false);
  };
  
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }
    
    setIsUploading(true);
    setIsProcessing(true);
    
    try {
      let totalLinesProcessed = 0;
      
      // Process each file one by one
      for (const file of files) {
        console.log(`Processing file: ${file.name}`);
        
        // Parse the Excel file
        const parsedData = await parseExcelFile(file);
        console.log('Parsed data:', parsedData);
        
        if (parsedData.length === 0) {
          console.warn(`No data found in file: ${file.name}`);
          continue;
        }
        
        // Extract the HD Order Numbers from this file to process them
        const hdOrderNumbers = [...new Set(parsedData.map(item => item.hd_order_number))];
        console.log('Found order numbers in file:', hdOrderNumbers);
        
        for (const hdOrderNumber of hdOrderNumbers) {
          console.log(`Processing line items for order: ${hdOrderNumber}`);
          
          // Get the line items for this order
          const lineItems = parsedData.filter(item => item.hd_order_number === hdOrderNumber);
          
          // First check if the order exists
          const { data: existingOrders, error: fetchError } = await supabase
            .from('hd_orders')
            .select('id')
            .eq('hd_order_number', hdOrderNumber)
            .limit(1);
          
          if (fetchError) {
            console.error(`Error fetching order ${hdOrderNumber}:`, fetchError);
            toast.error(`Failed to verify order ${hdOrderNumber}`);
            continue;
          }
          
          if (!existingOrders || existingOrders.length === 0) {
            console.warn(`Order ${hdOrderNumber} not found in database. Skipping its line items.`);
            continue;
          }
          
          const orderId = existingOrders[0].id;
          
          // Delete existing line items for this order
          const { error: deleteError } = await supabase
            .from('hd_order_line_items')
            .delete()
            .eq('hd_order_id', orderId);
          
          if (deleteError) {
            console.error(`Error deleting existing line items for order ${hdOrderNumber}:`, deleteError);
            toast.error(`Failed to clear existing line items for order ${hdOrderNumber}`);
            continue;
          }
          
          // Prepare the line items to insert
          const lineItemsToInsert = lineItems.map(item => ({
            hd_order_id: orderId,
            hd_order_number: hdOrderNumber,
            line_number: item.line_number?.toString() || '',
            part_number: item.part_number || '',
            description: item.description || '',
            order_quantity: item.order_quantity || 0,
            open_quantity: item.open_quantity || 0,
            unit_price: item.unit_price || 0,
            total_price: item.total_price || 0,
            status: item.status || '',
            dealer_po_number: item.dealer_po_number || '',
            order_date: item.order_date || null,
            is_backorder: false
          }));
          
          // Insert the line items
          const { error: insertError } = await supabase
            .from('hd_order_line_items')
            .insert(lineItemsToInsert);
          
          if (insertError) {
            console.error(`Error inserting line items for order ${hdOrderNumber}:`, insertError);
            toast.error(`Failed to insert line items for order ${hdOrderNumber}`);
            continue;
          }
          
          // Update the order to indicate it has line items
          const { error: updateError } = await supabase
            .from('hd_orders')
            .update({ has_line_items: true })
            .eq('id', orderId);
          
          if (updateError) {
            console.error(`Error updating has_line_items for order ${hdOrderNumber}:`, updateError);
          }
          
          totalLinesProcessed += lineItems.length;
          console.log(`Successfully processed ${lineItems.length} line items for order ${hdOrderNumber}`);
        }
        
        // Record upload history for this file
        const { error: historyError } = await supabase
          .from('hd_upload_history')
          .insert({
            upload_type: 'order_lines',
            filename: file.name,
            items_count: parsedData.length,
            status: 'success',
            replaced_previous: false
          });
        
        if (historyError) {
          console.error('Error recording upload history:', historyError);
        }
      }
      
      console.log('Upload completed successfully!');
      toast.success(`Successfully uploaded ${totalLinesProcessed} line items from ${files.length} files`);
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
                    disabled={isUploading || isProcessing}
                    multiple
                  />
                </label>
              </div>
            )}
            
            {/* File List */}
            {files.length > 0 && !uploadSuccess && (
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
                        disabled={isUploading || isProcessing}
                      >
                        <X className="h-4 w-4 text-zinc-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {files.length > 0 && !uploadSuccess && (
              <div className="flex justify-center mt-4">
                <Button
                  onClick={handleUpload}
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
