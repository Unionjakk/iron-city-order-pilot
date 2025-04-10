
const ApiDocumentation = () => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-orange-400 mb-2">Endpoint Information</h3>
        <code className="block p-4 bg-zinc-800/60 rounded-lg text-sm text-zinc-300 font-mono overflow-x-auto">
          https://opus-harley-davidson.myshopify.com/admin/api/2023-07/orders.json<br/>
          ?status=unfulfilled<br/>
          &limit=250<br/>
          &fields=id,created_at,customer,line_items,shipping_address,note
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
          <li>Integration with Pinnacle inventory system</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiDocumentation;
