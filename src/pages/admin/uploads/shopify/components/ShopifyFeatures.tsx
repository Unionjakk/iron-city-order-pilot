import ImportControlsCard from './ImportControlsCard';
import DatabaseHealthCheckCard from './DatabaseHealthCheckCard';
import OrdersViewCard from './OrdersViewCard';
import CompleteRefresh from '@/components/shopify/CompleteRefresh';
import LocationInfoImport from '@/components/shopify/LocationInfoImport';
import SingleLineItemLocationUpdate from '@/components/shopify/SingleLineItemLocationUpdate';
import LocationsExplorer from '@/components/shopify/LocationsExplorer';
import BatchLocationUpdate from '@/components/shopify/BatchLocationUpdate';
import BatchLocationUpdateV2 from '@/components/shopify/BatchLocationUpdateV2';
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
  const [isRefreshInProgress, setIsRefreshInProgress] = useState(false);
  const [isStandaloneImportInProgress, setIsStandaloneImportInProgress] = useState(false);

  const handleStandaloneImportComplete = async () => {
    setIsStandaloneImportInProgress(false);
    await fetchRecentOrders();
  };

  return (
    <>
      <ImportControlsCard 
        lastImport={lastImport} 
        fetchRecentOrders={fetchRecentOrders} 
        ordersLoading={ordersLoading}
        handleRefresh={handleRefresh}
        apiError={apiConnectionError}
      />
      
      <SingleOrderImport
        onImportComplete={fetchRecentOrders}
      />
      
      <AllOpenOrdersImport
        onImportComplete={handleStandaloneImportComplete}
      />
      
      <CompleteRefresh
        onRefreshComplete={fetchRecentOrders}
        onRefreshStatusChange={setIsRefreshInProgress}
      />
      
      <BatchLocationUpdateV2 
        disabled={isRefreshInProgress || isStandaloneImportInProgress}
      />
      
      <BatchLocationUpdate 
        disabled={isRefreshInProgress || isStandaloneImportInProgress}
      />
      
      <LocationInfoImport
        onImportComplete={fetchRecentOrders}
      />
      
      <SingleLineItemLocationUpdate
        onUpdateComplete={fetchRecentOrders}
      />
      
      <LocationsExplorer />
      
      <DatabaseHealthCheckCard />
      
      <OrdersViewCard 
        importedOrders={importedOrders} 
        archivedOrders={[]} 
        ordersLoading={ordersLoading} 
      />
    </>
  );
};

export default ShopifyFeatures;
