
import ImportControlsCard from './ImportControlsCard';
import DatabaseHealthCheckCard from './DatabaseHealthCheckCard';
import OrdersViewCard from './OrdersViewCard';
import CompleteRefresh from '@/components/shopify/CompleteRefresh';
import LocationInfoImport from '@/components/shopify/LocationInfoImport';
import SingleLineItemLocationUpdate from '@/components/shopify/SingleLineItemLocationUpdate';
import LocationsExplorer from '@/components/shopify/LocationsExplorer';
import BatchLocationUpdate from '@/components/shopify/BatchLocationUpdate';
import { ShopifyOrder } from '@/components/shopify/OrdersTable';

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
      
      {/* Complete Refresh Card */}
      <CompleteRefresh
        onRefreshComplete={fetchRecentOrders}
      />
      
      {/* Batch Location Update */}
      <BatchLocationUpdate />
      
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
