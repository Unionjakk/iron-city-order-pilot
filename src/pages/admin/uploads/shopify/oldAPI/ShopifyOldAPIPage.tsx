
// This is the original Shopify API page, moved to a new location
import { useShopifyPageState } from '../hooks/useShopifyPageState';
import PageHeader from '../components/PageHeader';
import ApiConfigCard from '../components/ApiConfigCard';
import ApiDocumentationCard from '../components/ApiDocumentationCard';
import ProductionWarningAlert from '../components/ProductionWarningAlert';
import ShopifyFeatures from '../components/ShopifyFeatures';

const ShopifyOldAPIPage = () => {
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
      <div>
        <h1 className="text-2xl font-bold text-orange-500">Leeds Harley Shopify Integration (Legacy)</h1>
        <p className="text-orange-400/80">Configure and manage Shopify order imports (old version)</p>
      </div>
      
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

export default ShopifyOldAPIPage;
