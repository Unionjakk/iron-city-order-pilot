
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PinnacleSettingsCard, PinnacleNotesCard } from './pinnacle/PinnacleInfoCards';
import PinnacleUploadCard from './pinnacle/PinnacleUploadCard';

const PinnacleUpload = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [stockCount, setStockCount] = useState<number | null>(null);
  const [lastUpload, setLastUpload] = useState<string | null>(null);

  // Fetch stock data stats on component mount
  const fetchStockStats = async () => {
    try {
      setIsLoading(true);
      // Get count of stock items using execute_sql function
      const { data: countData, error: countError } = await supabase
        .rpc('execute_sql', { sql: 'SELECT COUNT(*) as count FROM pinnacle_stock' });
      
      if (countError) throw countError;
      
      // Safely extract count value with proper type checking
      if (countData && Array.isArray(countData) && countData.length > 0) {
        // The count will be in the first object of the array, in a property named 'count'
        const countObj = countData[0] as Record<string, any>;
        const countValue = countObj?.count;
        
        // Convert to number if it's a string
        setStockCount(typeof countValue === 'number' ? countValue : parseInt(String(countValue)) || 0);
      } else {
        setStockCount(0);
      }
      
      // Get most recent upload using execute_sql function
      const { data: uploadHistory, error: historyError } = await supabase
        .rpc('execute_sql', { 
          sql: 'SELECT upload_timestamp FROM pinnacle_upload_history ORDER BY upload_timestamp DESC LIMIT 1' 
        });
      
      if (historyError) throw historyError;
      
      // Safely extract timestamp with proper type checking
      if (uploadHistory && Array.isArray(uploadHistory) && uploadHistory.length > 0) {
        const historyObj = uploadHistory[0] as Record<string, any>;
        const timestamp = historyObj?.upload_timestamp;
        
        if (timestamp) {
          setLastUpload(new Date(String(timestamp)).toLocaleString());
        }
      }
    } catch (error) {
      console.error('Error fetching stock stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Call fetchStockStats on component mount
  useEffect(() => {
    fetchStockStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">Pinnacle Stock Upload</h1>
        <p className="text-orange-400/80">Import inventory data from Pinnacle system</p>
      </div>
      
      {/* Pinnacle Settings Card */}
      <PinnacleSettingsCard />
      
      {/* File Upload Card */}
      <PinnacleUploadCard 
        file={file}
        setFile={setFile}
        stockCount={stockCount}
        lastUpload={lastUpload}
        fetchStockStats={fetchStockStats}
        isLoading={isLoading}
      />
      
      {/* Additional Information */}
      <PinnacleNotesCard />
    </div>
  );
};

export default PinnacleUpload;
