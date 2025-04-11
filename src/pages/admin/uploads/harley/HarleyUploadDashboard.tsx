
import HarleyStatsCard from './components/HarleyStatsCard';
import HarleyUploadTiles from './components/HarleyUploadTiles';
import HarleyUploadInstructions from './components/HarleyUploadInstructions';
import HarleyActivityLog from './components/HarleyActivityLog';
import { useHarleyDashboardData } from './hooks/useHarleyDashboardData';

const HarleyUploadDashboard = () => {
  // Use our custom hook to fetch all data
  const { 
    stats, 
    isLoadingStats, 
    recentUploads, 
    isLoadingUploads 
  } = useHarleyDashboardData();
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">Harley Davidson Import Dashboard</h1>
        <p className="text-orange-400/80">Upload and manage Harley Davidson order data</p>
      </div>
      
      {/* Stats Card */}
      <HarleyStatsCard stats={stats} isLoading={isLoadingStats} />
      
      {/* Upload Tiles - now organized in groups */}
      <div className="my-8">
        <HarleyUploadTiles />
      </div>
      
      {/* Processing Instructions */}
      <HarleyUploadInstructions />
      
      {/* Recent Activity Log */}
      <HarleyActivityLog uploads={recentUploads} isLoading={isLoadingUploads} />
    </div>
  );
};

export default HarleyUploadDashboard;
