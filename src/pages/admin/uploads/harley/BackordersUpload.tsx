
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, Truck, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Code } from '@/components/ui/code';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import UploadSuccessDisplay from './components/UploadSuccessDisplay';

interface BackorderDataItem {
  hd_order_number: string;
  line_number: string | number;
  dealer_po_number?: string;
  order_date?: string | Date;
  backorder_clear_by?: string | Date;
  description?: string;
  part_number: string;
  quantity?: number;
  projected_shipping_date?: string | Date;
  projected_shipping_quantity?: number;
  total_price?: number;
}

interface UploadStats {
  processed: number;
  replaced: number;
  errors: number;
}

const parseExcelFile = async (file: File): Promise<BackorderDataItem[]> => {
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
        const mappedData: BackorderDataItem[] = jsonData.map(row => {
          // Find the HD order number (could have different column names)
          const hdOrderNumber = row['HD ORDER NUMBER'] || row['ORDER NUMBER'] || row['SALES ORDER'] || row['HD ORDER'] || '';
          
          // Find line number (could have different column names)
          const lineNumber = row['LINE NUMBER'] || row['LINE'] || row['LINE #'] || row['*LINE'] || '';
          
          // Get part number (could have different column names)
          const partNumber = row['PART NUMBER'] || row['PART'] || row['PART #'] || row['PART NO'] || row['*PART NUMBER'] || '';
          
          // More extensive matching for dealer PO number field
          const dealerPoNumber = row['DEALER PO NUMBER'] || row['PO NUMBER'] || row['PURCHASE ORDER'] || 
                                row['DEALER PO'] || row['CUST PO'] || row['*DEALER PO NUMBER'] || '';
          
          // Find backorder clear by date with more variations
          const backorderClearBy = row['BACKORDER CLEAR BY'] || row['CLEAR BY'] || row['BO CLEAR'] || row['*B/O CLEAR'] || '';
          
          // Parse projected shipping quantity, ensuring it's converted to a number
          let projectedShippingQty = 0;
          const projShippingQtyRaw = row['PROJECTED SHIPPING QUANTITY'] || row['PROJ SHIPPING QTY'] || 
                                    row['SHIP QTY'] || row['*PROJECTED SHIPPING QTY'] || '';
                                    
          if (projShippingQtyRaw) {
            // Try to convert to number, handling various formats
            try {
              // Remove any non-numeric characters except decimal point
              const numericStr = String(projShippingQtyRaw).replace(/[^0-9.]/g, '');
              projectedShippingQty = parseFloat(numericStr) || 0;
            } catch (err) {
              console.warn('Error parsing projected shipping quantity:', projShippingQtyRaw);
              projectedShippingQty = 0;
            }
          }
          
          // Log found values for debugging
          console.log(`Order: ${hdOrderNumber}, Line: ${lineNumber}, PO: ${dealerPoNumber}, B/O Clear: ${backorderClearBy}, Ship Qty: ${projectedShippingQty}`);
          
          if (!hdOrderNumber || !partNumber) {
            console.warn('Missing required fields in row:', row);
          }
          
          return {
            hd_order_number: hdOrderNumber,
            line_number: lineNumber,
            dealer_po_number: dealerPoNumber,
            order_date: row['ORDER DATE'] || row['ORDER'] || null,
            backorder_clear_by: backorderClearBy,
            description: row['DESCRIPTION'] || row['PART DESCRIPTION'] || row['*DESCRIPTION'] || '',
            part_number: partNumber,
            quantity: parseFloat(String(row['QUANTITY'] || row['QTY'] || row['*QUANTITY'] || '0').replace(/[^0-9.]/g, '')) || 0,
            projected_shipping_date: row['PROJECTED SHIPPING DATE'] || row['SHIP DATE'] || row['*PROJECTED SHIPPING DATE'] || null,
            projected_shipping_quantity: projectedShippingQty,
            total_price: parseFloat(String(row['TOTAL PRICE'] || row['PRICE'] || row['TOTAL'] || row['*TOTAL'] || '0').replace(/[^0-9.]/g, '')) || 0
          };
        }).filter(item => item.hd_order_number && item.part_number);
        
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

const BackordersUpload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadStats, setUploadStats] = useState<UploadStats>({
    processed: 0,
    replaced: 0,
    errors: 0
  });
  
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
      
      // Create a new upload batch ID
      const uploadBatchId = crypto.randomUUID();
      console.log('Upload batch ID:', uploadBatchId);
      
      // First, clear existing backorder records
      console.log('Clearing existing backorder records...');
      const { error: clearError } = await supabase
        .from('hd_backorders')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition to delete all
      
      if (clearError) {
        console.error('Error clearing existing backorder records:', clearError);
        toast.error('Failed to clear existing backorder data');
        setIsUploading(false);
        setIsProcessing(false);
        return;
      }
      
      console.log('Processing backorder data...');
      let successCount = 0;
      let errorCount = 0;
      let notFoundCount = 0;
      
      // Process each backorder item
      for (const item of parsedData) {
        // Convert line_number to string to ensure consistent type
        const lineNumberStr = String(item.line_number);
        
        // Find the matching line item
        const { data: lineItems, error: findError } = await supabase
          .from('hd_order_line_items')
          .select('id')
          .eq('hd_order_number', item.hd_order_number)
          .eq('line_number', lineNumberStr)
          .eq('part_number', item.part_number);
        
        if (findError) {
          console.error('Error finding line item:', findError);
          errorCount++;
          continue;
        }
        
        // Log debug information
        console.log(`Looking for line item: Order=${item.hd_order_number}, Line=${lineNumberStr}, Part=${item.part_number}`);
        console.log(`Found line items:`, lineItems);
        
        // Prepare date fields as strings
        const backorderClearBy = item.backorder_clear_by ? 
          (item.backorder_clear_by instanceof Date ? 
            item.backorder_clear_by.toISOString().split('T')[0] : 
            String(item.backorder_clear_by)) : 
          null;
          
        const projectedShippingDate = item.projected_shipping_date ? 
          (item.projected_shipping_date instanceof Date ? 
            item.projected_shipping_date.toISOString().split('T')[0] : 
            String(item.projected_shipping_date)) : 
          null;
          
        const orderDate = item.order_date ? 
          (item.order_date instanceof Date ? 
            item.order_date.toISOString().split('T')[0] : 
            String(item.order_date)) : 
          null;
        
        // Determine if we have a matching line item
        const lineItemId = lineItems && lineItems.length > 0 ? lineItems[0].id : null;
        
        if (!lineItemId) {
          console.warn(`No matching line item found for order ${item.hd_order_number}, line ${lineNumberStr}, part ${item.part_number}`);
          notFoundCount++;
        }
        
        // Log the values being inserted
        console.log('Inserting backorder with values:', {
          line_item_id: lineItemId,
          hd_order_number: item.hd_order_number,
          line_number: lineNumberStr,
          dealer_po_number: item.dealer_po_number,
          order_date: orderDate,
          backorder_clear_by: backorderClearBy,
          description: item.description,
          part_number: item.part_number,
          quantity: item.quantity,
          projected_shipping_date: projectedShippingDate,
          projected_shipping_quantity: item.projected_shipping_quantity,
          total_price: item.total_price
        });
        
        // Insert the backorder record with or without line_item_id
        const { error: insertError } = await supabase
          .from('hd_backorders')
          .insert({
            line_item_id: lineItemId,
            hd_order_number: item.hd_order_number,
            line_number: lineNumberStr,
            dealer_po_number: item.dealer_po_number || null,
            order_date: orderDate,
            backorder_clear_by: backorderClearBy,
            description: item.description || null,
            part_number: item.part_number,
            quantity: item.quantity || 0,
            projected_shipping_date: projectedShippingDate,
            projected_shipping_quantity: item.projected_shipping_quantity || 0,
            total_price: item.total_price || 0,
            upload_batch_id: uploadBatchId
          });
        
        if (insertError) {
          console.error('Error inserting backorder record:', insertError);
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
      
      console.log('Upload completed with results:', { 
        successCount, 
        errorCount,
        notFoundCount,
        total: parsedData.length
      });
      
      const stats: UploadStats = {
        processed: successCount,
        replaced: notFoundCount,
        errors: errorCount
      };
      
      setUploadStats(stats);
      
      if (errorCount === 0) {
        if (notFoundCount > 0) {
          toast.warning(`Processed ${successCount} backorder items. ${notFoundCount} items didn't match existing line items but were still recorded.`);
        } else {
          toast.success(`Successfully processed ${successCount} backorder items`);
        }
      } else {
        toast.warning(`Processed ${successCount} items with ${errorCount} errors. ${notFoundCount} items without matching line items.`);
      }
      
      setUploadSuccess(true);
      setIsProcessing(false);
      
    } catch (error) {
      console.error('Error processing upload:', error);
      toast.error('An error occurred during processing');
      setIsUploading(false);
      setIsProcessing(false);
    }
  };
  
  if (uploadSuccess) {
    return <UploadSuccessDisplay stats={uploadStats} />;
  }
  
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
            
            {file && (
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
