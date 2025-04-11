
import { useState } from 'react';
import { toast } from 'sonner';
import { OrderLineItem, parseExcelFile } from '../utils/excelParser';
import { 
  processOrderLineItems, 
  recordUploadHistory, 
  UploadStats 
} from '../services/orderLineItemsService';

export const useOrderLinesUpload = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadStats, setUploadStats] = useState<UploadStats>({ 
    processed: 0, 
    replaced: 0, 
    errors: 0 
  });
  
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
    setUploadStats({ processed: 0, replaced: 0, errors: 0 });
    
    try {
      let finalStats = { processed: 0, replaced: 0, errors: 0 };
      
      for (const file of files) {
        console.log(`Processing file: ${file.name}`);
        
        const parsedData = await parseExcelFile(file);
        console.log('Parsed data:', parsedData);
        
        if (parsedData.length === 0) {
          console.warn(`No data found in file: ${file.name}`);
          continue;
        }
        
        await processOrderLineItems(parsedData, finalStats, setUploadStats);
        
        await recordUploadHistory(
          file.name, 
          parsedData.length, 
          finalStats.replaced > 0
        );
        
        // Update the finalStats for toast message
        finalStats = { ...uploadStats };
      }
      
      console.log('Upload completed successfully!');
      // Only show the toast message once with the final stats
      toast.success(`Successfully uploaded ${uploadStats.processed} line items (${uploadStats.replaced} replaced)`);
      setUploadSuccess(true);
      setIsProcessing(false);
      setIsUploading(false);
      
      // Removed the automatic redirect to dashboard
      
    } catch (error) {
      console.error('Error processing upload:', error);
      toast.error('An error occurred during processing');
      setIsUploading(false);
      setIsProcessing(false);
    }
  };
  
  return {
    files,
    isUploading,
    isProcessing,
    uploadSuccess,
    uploadStats,
    handleFileChange,
    removeFile,
    handleUpload
  };
};

export default useOrderLinesUpload;
