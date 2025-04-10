
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
      
      // First, get count of stock items
      const { data: countData, error: countError } = await supabase
        .from('pinnacle_stock')
        .select('id', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Error fetching stock count:', countError);
      } else {
        // Get the count from the response
        setStockCount(countData?.length !== undefined ? countData.length : null);
      }
      
      // Then, get most recent upload timestamp
      const { data: uploadData, error: uploadError } = await supabase
        .from('pinnacle_upload_history')
        .select('upload_timestamp')
        .order('upload_timestamp', { ascending: false })
        .limit(1);
      
      if (uploadError) {
        console.error('Error fetching last upload:', uploadError);
      } else if (uploadData && uploadData.length > 0) {
        setLastUpload(uploadData[0].upload_timestamp);
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
