
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Code } from '@/components/ui/code';
import { ExternalLink } from 'lucide-react';

const ApiDocumentation = () => {
  const [apiEndpoint, setApiEndpoint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the API endpoint from database settings
  useEffect(() => {
    const fetchApiEndpoint = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_shopify_setting', { 
          setting_name_param: 'shopify_api_endpoint' 
        });
        
        if (error) {
          console.error('Error retrieving API endpoint:', error);
        } else {
          setApiEndpoint(data || 'https://opus-harley-davidson.myshopify.com/admin/api/2023-07/orders.json');
        }
      } catch (error) {
        console.error('Exception retrieving API endpoint:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiEndpoint();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-zinc-200 mb-2">Current API Configuration</h3>
        <Alert className="bg-zinc-800/60 border-zinc-700">
          <AlertDescription className="text-zinc-300">
            <div className="flex flex-col space-y-1">
              <div>
                <span className="text-zinc-400">API Endpoint:</span> 
                <Code className="ml-2 bg-zinc-700/50">
                  {isLoading ? 'Loading...' : apiEndpoint}
                </Code>
              </div>
              <div>
                <span className="text-zinc-400">API Version:</span> 
                <Code className="ml-2 bg-zinc-700/50">2023-07</Code>
              </div>
              <div>
                <span className="text-zinc-400">Pagination:</span> 
                <Code className="ml-2 bg-zinc-700/50">Link Header (REST)</Code>
              </div>
              <div className="text-sm text-zinc-500 mt-1">
                The system connects to the Shopify Admin API using the configured API token and endpoint.
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>

      <Separator className="bg-zinc-800" />

      <div>
        <h3 className="font-medium text-zinc-200 mb-2">API Usage & Limitations</h3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 pl-2">
          <li>
            <span className="text-zinc-400">Rate Limits:</span> Shopify enforces call limits of 40 requests per minute per API token.
          </li>
          <li>
            <span className="text-zinc-400">Order Limit:</span> Only unfulfilled orders are imported by default.
          </li>
          <li>
            <span className="text-zinc-400">Pagination:</span> The system uses the Link header for pagination to handle large order sets.
          </li>
          <li>
            <span className="text-zinc-400">Order Status:</span> Orders marked as fulfilled in Shopify are automatically archived.
          </li>
        </ul>
      </div>

      <Separator className="bg-zinc-800" />

      <div>
        <h3 className="font-medium text-zinc-200 mb-2">Support Resources</h3>
        <div className="flex flex-col space-y-2">
          <a 
            href="https://shopify.dev/docs/api/admin-rest" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 flex items-center"
          >
            Shopify Admin API Documentation <ExternalLink className="ml-1 h-3 w-3" />
          </a>
          <a 
            href="https://shopify.dev/docs/api/usage/pagination-rest" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 flex items-center"
          >
            Shopify REST Pagination Guide <ExternalLink className="ml-1 h-3 w-3" />
          </a>
          <a 
            href="https://shopify.dev/docs/api/admin-rest/current/resources/order" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 flex items-center"
          >
            Shopify Order API Reference <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ApiDocumentation;
