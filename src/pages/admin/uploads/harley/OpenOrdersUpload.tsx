import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileSpreadsheet, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Code } from '@/components/ui/code';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface OpenOrderData {
  hd_order_number: string;
  dealer_po_number?: string;
  order_date?: string | Date;
  total_price?: number;
  ship_to?: string;
  order_type?: string;
  terms?: string;
  notes?: string;
}

const parseExcelFile = async (file: File): Promise<OpenOrderData[]> => {
  console.log('Parsing file:', file.name);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Failed to read file data'));
          return;
        }
        
        // Parse the Excel file
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { raw: false });
        console.log('Raw Excel data:', jsonData);
        
        if (!jsonData || jsonData.length === 0) {
          reject(new Error('No data found in Excel file'));
          return;
        }
        
        // Map the Excel data to our expected format, accounting for different possible column names
        const mappedData: OpenOrderData[] = jsonData.map(row => {
          // Find the HD order number (could have different column names)
          const hdOrderNumber = row['HD ORDER NUMBER'] || row['ORDER NUMBER'] || row['SALES ORDER'] || '';
          
          if (!hdOrderNumber) {
            console.warn('Missing HD Order Number in row:', row);
          }
          
          return {
            hd_order_number: hdOrderNumber,
            dealer_po_number: row['PO NUMBER'] || row['PURCHASE ORDER'] || row['DEALER PO'] || '',
            order_date: row['ORDER DATE'] || null,
            total_price: parseFloat(row['TOTAL PRICE'] || row['PRICE'] || row['TOTAL'] || '0'),
            ship_to: row['SHIP TO'] || row['DEALER'] || '',
            order_type: row['ORDER TYPE'] || row['TYPE'] || '',
            terms: row['TERMS'] || '',
            notes: row['NOTES'] || row['COMMENTS'] || ''
          };
        }).filter(item => item.hd_order_number);
        
        console.log('Mapped data:', mappedData);
        resolve(mappedData);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      reject(error);
    };
    
    reader.readAsBinaryString(file);
  });
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
      
      // First check if there are any existing orders before trying to clear them
      console.log('Checking if there are existing orders to clear...');
      const { count, error: countError } = await supabase
        .from('hd_orders')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Error checking existing orders count:', countError);
        toast.error('Failed to check existing orders');
        setIsUploading(false);
        setIsProcessing(false);
        return;
      }
      
      // Only clear existing orders if there are any
      if (count && count > 0) {
        console.log(`Found ${count} existing orders, clearing them...`);
        const { error: clearError } = await supabase
          .from('hd_orders')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (clearError) {
          console.error('Error clearing existing orders:', clearError);
          toast.error('Failed to clear existing orders');
          setIsUploading(false);
          setIsProcessing(false);
          return;
        }
        console.log('Successfully cleared existing orders');
      } else {
        console.log('No existing orders found, skipping deletion step');
      }
      
      console.log('Inserting new order data...');
      
      // Prepare the array of orders to insert - making sure to convert Date objects to strings
      const ordersToInsert = parsedData.map(order => {
        // Convert order_date to string if it's a Date object
        const orderDate = order.order_date ? 
          (order.order_date instanceof Date ? 
            order.order_date.toISOString().split('T')[0] : 
            String(order.order_date)) : 
          null;
        
        return {
          hd_order_number: order.hd_order_number,
          dealer_po_number: order.dealer_po_number || '',
          order_date: orderDate,
          total_price: order.total_price || 0,
          ship_to: order.ship_to || '',
          order_type: order.order_type || '',
          terms: order.terms || '',
          notes: order.notes || '',
          has_line_items: false
        };
      });
      
      // Insert the orders
      for (let i = 0; i < ordersToInsert.length; i += 100) {
        // Process in batches of 100 to avoid payload size issues
        const batch = ordersToInsert.slice(i, i + 100);
        const { error: insertError } = await supabase
          .from('hd_orders')
          .insert(batch);
        
        if (insertError) {
          console.error('Error inserting orders batch:', insertError);
          toast.error('Failed to insert all orders');
          setIsUploading(false);
          setIsProcessing(false);
          return;
        }
      }
      
      console.log('Recording upload history...');
      // Insert upload history record
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
      }
      
      console.log('Upload completed successfully!');
      toast.success(`Successfully uploaded ${parsedData.length} orders`);
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
        <h1 className="text-2xl font-bold text-orange-500">Upload Harley Davidson Open Orders</h1>
        <p className="text-orange-400/80">Import order information from H-D NET Open Orders screen</p>
      </div>
      
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
