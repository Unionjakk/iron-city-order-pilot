
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
      // Create a cumulative stats object to track all files processed
      let cumulativeStats = { processed: 0, replaced: 0, errors: 0 };
      
      // Process each file individually
      for (const file of files) {
        console.log(`Processing file: ${file.name}`);
        
        // Parse the Excel file
        const parsedData = await parseExcelFile(file);
        console.log(`Parsed data from ${file.name}:`, parsedData.length, 'rows');
        
        if (parsedData.length === 0) {
          console.warn(`No data found in file: ${file.name}`);
          toast.warning(`No data found in file: ${file.name}`);
          continue;
        }
        
        // Process the line items for this file and update the stats
        await processOrderLineItems(
          parsedData, 
          cumulativeStats,
          (newStats) => {
            cumulativeStats = newStats;
            setUploadStats(newStats);
          }
        );
        
        // Record upload history for this file
        await recordUploadHistory(
          file.name, 
          parsedData.length, 
          cumulativeStats.replaced > 0
        );
      }
      
      console.log('Upload completed successfully!');
      toast.success(`Successfully uploaded ${cumulativeStats.processed} line items (${cumulativeStats.replaced} replaced)`);
      setUploadSuccess(true);
      
    } catch (error) {
      console.error('Error processing upload:', error);
      toast.error('An error occurred during processing');
    } finally {
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
