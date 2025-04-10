
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ShopifyAPI = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-800">Shopify API Integration</h1>
        <p className="text-orange-600">Configure Shopify integration settings</p>
      </div>
      
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-700">Coming Soon: Shopify API Configuration</CardTitle>
          <CardDescription>Seamless order management integration</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This module will provide:</p>
          
          <ul className="list-disc pl-5 space-y-2">
            <li>Secure API credential management for your Shopify store</li>
            <li>Automated order synchronization with customizable filters</li>
            <li>Bidirectional updates for order status and tracking information</li>
            <li>Customer communication templates for order updates</li>
            <li>Inventory level synchronization with your Shopify store</li>
            <li>Webhook configuration for real-time event processing</li>
          </ul>
          
          <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h3 className="font-medium text-orange-700 mb-2">Development In Progress</h3>
            <p className="text-sm">We're currently building this feature to create a reliable, secure connection to your Shopify store. The completed module will allow for real-time order processing and customer updates without manual intervention.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopifyAPI;
