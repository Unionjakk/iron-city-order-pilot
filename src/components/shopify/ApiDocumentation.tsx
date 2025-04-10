
import { ArrowRight, RefreshCw, Archive } from 'lucide-react';

const ApiDocumentation = () => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-orange-400 mb-2">Endpoint Information</h3>
        <code className="block p-4 bg-zinc-800/60 rounded-lg text-sm text-zinc-300 font-mono overflow-x-auto">
          https://opus-harley-davidson.myshopify.com/admin/api/2023-07/orders.json<br/>
          ?status=unfulfilled<br/>
          &limit=250<br/>
          &fields=id,created_at,customer,line_items,shipping_address,note,fulfillment_status
        </code>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-orange-400 mb-2">Integration Features</h3>
        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
          <li>Secure API token storage and management</li>
          <li>Automatic filtering for unfulfilled orders</li>
          <li>Scheduled imports every 30 minutes</li>
          <li>Manual import trigger for immediate updates</li>
          <li>Order status tracking through fulfillment workflow</li>
          <li className="flex items-center">
            <Archive className="mr-2 h-4 w-4 text-purple-500" />
            Automatic archiving of fulfilled orders
          </li>
          <li className="flex items-center">
            <RefreshCw className="mr-2 h-4 w-4 text-blue-500" />
            Synchronization with Shopify to maintain order status accuracy
          </li>
        </ul>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-orange-400 mb-2">System Workflow</h3>
        <div className="bg-zinc-800/60 p-4 rounded-lg">
          <ol className="list-decimal pl-5 space-y-4 text-zinc-300">
            <li className="pb-3 border-b border-zinc-700">
              <strong className="text-orange-400">Import Process</strong>
              <p className="mt-1 text-sm text-zinc-400">
                Orders are imported from Shopify via the API. Only unfulfilled orders are fetched to prevent duplicate processing of completed orders.
              </p>
            </li>
            <li className="pb-3 border-b border-zinc-700">
              <strong className="text-orange-400">Processing Workflow</strong>
              <p className="mt-1 text-sm text-zinc-400">
                Orders move through your fulfillment workflow with status updates: Imported <ArrowRight className="inline h-3 w-3" /> Stock Checked <ArrowRight className="inline h-3 w-3" /> Partial Pick/Backorder <ArrowRight className="inline h-3 w-3" /> Fulfilled
              </p>
            </li>
            <li>
              <strong className="text-orange-400">Archiving Process</strong>
              <p className="mt-1 text-sm text-zinc-400">
                When orders are fulfilled in Shopify, they're automatically moved to the archive table during the next sync. This maintains a complete history while keeping the active order list focused only on orders that need attention.
              </p>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ApiDocumentation;
