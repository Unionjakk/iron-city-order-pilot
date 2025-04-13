
import ImportControlsCard from './ImportControlsCard';
import DatabaseHealthCheckCard from './DatabaseHealthCheckCard';
import OrdersViewCard from './OrdersViewCard';
import CompleteRefresh from '@/components/shopify/CompleteRefresh';
import LocationInfoImport from '@/components/shopify/LocationInfoImport';
import SingleLineItemLocationUpdate from '@/components/shopify/SingleLineItemLocationUpdate';
import LocationsExplorer from '@/components/shopify/LocationsExplorer';
import BatchLocationUpdate from '@/components/shopify/BatchLocationUpdate';
import SingleOrderImport from '@/components/shopify/SingleOrderImport';
import AllOpenOrdersImport from '@/components/shopify/AllOpenOrdersImport';
import { ShopifyOrder } from '@/components/shopify/OrdersTable';
import { useState } from 'react';

interface ShopifyFeaturesProps {
  lastImport: string | null;
  fetchRecentOrders: () => Promise<void>;
  ordersLoading: boolean;
  handleRefresh: () => void;
  apiConnectionError: string | null;
  importedOrders: ShopifyOrder[];
}

const ShopifyFeatures = ({
  lastImport,
  fetchRecentOrders,
  ordersLoading,
  handleRefresh,
  apiConnectionError,
  importedOrders
}: ShopifyFeaturesProps) => {
  // Add state to track if a refresh operation is in progress
  const [isRefreshInProgress, setIsRefreshInProgress] = useState(false);
  // Track if standalone imports are in progress
  const [isStandaloneImportInProgress, setIsStandaloneImportInProgress] = useState(false);

  // Handle completion of the standalone All Open Orders import
  const handleStandaloneImportComplete = async () => {
    setIsStandaloneImportInProgress(false);
    await fetchRecentOrders();
  };

  return (
    <>
      {/* Import Controls */}
      <ImportControlsCard 
        lastImport={lastImport} 
        fetchRecentOrders={fetchRecentOrders} 
        ordersLoading={ordersLoading}
        handleRefresh={handleRefresh}
        apiError={apiConnectionError}
      />
      
      {/* Single Order Import */}
      <SingleOrderImport
        onImportComplete={fetchRecentOrders}
      />
      
      {/* All Open Orders Import - Standalone Component */}
      <AllOpenOrdersImport
        onImportComplete={handleStandaloneImportComplete}
      />
      
      {/* Complete Refresh Card */}
      <CompleteRefresh
        onRefreshComplete={fetchRecentOrders}
        onRefreshStatusChange={setIsRefreshInProgress}
      />
      
      {/* Batch Location Update */}
      <BatchLocationUpdate 
        disabled={isRefreshInProgress || isStandaloneImportInProgress}
      />
      
      {/* Location Info Import */}
      <LocationInfoImport
        onImportComplete={fetchRecentOrders}
      />
      
      {/* Single Line Item Location Update */}
      <SingleLineItemLocationUpdate
        onUpdateComplete={fetchRecentOrders}
      />
      
      {/* Locations Explorer */}
      <LocationsExplorer />
      
      {/* Database Health Check */}
      <DatabaseHealthCheckCard />
      
      {/* Orders */}
      <OrdersViewCard 
        importedOrders={importedOrders} 
        archivedOrders={[]} 
        ordersLoading={ordersLoading} 
      />
    </>
  );
};

export default ShopifyFeatures;
