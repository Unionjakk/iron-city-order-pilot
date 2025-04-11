
import { useShopifyPageState } from './hooks/useShopifyPageState';
import PageHeader from './components/PageHeader';
import ApiConfigCard from './components/ApiConfigCard';
import ApiDocumentationCard from './components/ApiDocumentationCard';
import ProductionWarningAlert from './components/ProductionWarningAlert';
import ShopifyFeatures from './components/ShopifyFeatures';

// IMPORTANT: This component interacts with a PRODUCTION Shopify API
// Any changes must maintain compatibility with the live system
const ShopifyAPIPage = () => {
  const {
    hasToken,
    setHasToken,
    maskedToken,
    setMaskedToken,
    isLoading,
    apiConnectionError,
    importedOrders,
    lastImport,
    fetchRecentOrders,
    ordersLoading,
    handleRefresh
  } = useShopifyPageState();

  return (
    <div className="space-y-6">
      <PageHeader />
      
      <ProductionWarningAlert />
      
      {/* API Configuration Card */}
      <ApiConfigCard 
        isLoading={isLoading} 
        hasToken={hasToken} 
        maskedToken={maskedToken} 
        setHasToken={setHasToken} 
        setMaskedToken={setMaskedToken} 
      />
      
      {/* Show all features when token is available */}
      {hasToken && (
        <ShopifyFeatures
          lastImport={lastImport}
          fetchRecentOrders={fetchRecentOrders}
          ordersLoading={ordersLoading}
          handleRefresh={handleRefresh}
          apiConnectionError={apiConnectionError}
          importedOrders={importedOrders}
        />
      )}
      
      {/* API Documentation */}
      <ApiDocumentationCard />
    </div>
  );
};

export default ShopifyAPIPage;
