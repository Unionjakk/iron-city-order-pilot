
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Code } from '@/components/ui/code';
import { FileText, AlertTriangle } from 'lucide-react'; 
import OrdersNeedingLineItems from './components/OrdersNeedingLineItems';
import OrdersNeedingRefresh from './components/OrdersNeedingRefresh';
import OrderLinesInstructions from './components/OrderLinesInstructions';
import FileUploadZone from './components/FileUploadZone';
import UploadSuccessDisplay from './components/UploadSuccessDisplay';
import useOrderLinesUpload from './hooks/useOrderLinesUpload';
import { Alert, AlertDescription } from '@/components/ui/alert';

const OrderLinesUpload = () => {
  const {
    files,
    isUploading,
    isProcessing,
    uploadSuccess,
    uploadStats,
    handleFileChange,
    removeFile,
    handleUpload
  } = useOrderLinesUpload();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">Upload Harley Davidson Order Line Items</h1>
        <p className="text-orange-400/80">Import detailed part information for orders</p>
      </div>
      
      <OrderLinesInstructions />
      
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-500">
            <FileText className="mr-2 h-5 w-5" />
            File Upload
          </CardTitle>
          <CardDescription className="text-zinc-400">Upload H-D NET Order Line Items export files</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="warning" className="mb-4 bg-orange-500/10 text-orange-400 border-orange-500/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Multiple files upload is supported. Each file should contain data for a single HD Order.
              Line items for each order will be replaced when uploaded.
            </AlertDescription>
          </Alert>
          
          {uploadSuccess ? (
            <UploadSuccessDisplay stats={uploadStats} />
          ) : (
            <FileUploadZone
              files={files}
              isUploading={isUploading}
              isProcessing={isProcessing}
              onFileChange={handleFileChange}
              onRemoveFile={removeFile}
              onUpload={handleUpload}
            />
          )}
        </CardContent>
        <CardFooter className="border-t border-zinc-800 bg-zinc-900/30">
          <div className="w-full text-xs text-zinc-400">
            <p>Expected file format for each Order Line Items file:</p>
            <Code className="mt-2">
              HD ORDER NUMBER | LINE NUMBER | PART NUMBER | DESCRIPTION | ORDER QUANTITY | OPEN QUANTITY | UNIT PRICE | TOTAL PRICE | STATUS | PO NUMBER | ORDER DATE | INVOICE NUMBER | INVOICE DATE
            </Code>
          </div>
        </CardFooter>
      </Card>
      
      <OrdersNeedingLineItems />
      
      <OrdersNeedingRefresh />
    </div>
  );
};

export default OrderLinesUpload;
