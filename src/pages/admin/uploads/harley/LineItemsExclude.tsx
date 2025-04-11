
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Plus, AlertCircle, Info } from 'lucide-react';
import ExcludeOrderForm from './components/ExcludeOrderForm';
import ExcludeOrderList from './components/ExcludeOrderList';
import AwaitingOrdersList from './components/AwaitingOrdersList';
import { useExcludedOrders } from './hooks/useExcludedOrders';

const LineItemsExclude = () => {
  const { 
    excludedOrders, 
    isLoading, 
    addExclusion, 
    removeExclusion, 
    excludedOrderNumbers 
  } = useExcludedOrders();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">Open Order Check In</h1>
        <p className="text-orange-400/80">Check in open orders and exclude open orders</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Add New Exclusion */}
        <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-500">
              <Plus className="mr-2 h-5 w-5" />
              Add Order Check In
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Check in an order number to exclude from processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExcludeOrderForm onAddExclusion={addExclusion} />
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-500">
              <Info className="mr-2 h-5 w-5" />
              About Order Check In
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Why check in orders?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-zinc-300">
              <p>
                Checking in orders prevents specific HD orders from being processed during imports.
                This is useful for:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <span className="font-semibold text-orange-400">Check In:</span> Orders that need 
                  physical verification before processing
                </li>
                <li>
                  <span className="font-semibold text-orange-400">Not Shopify:</span> Orders that 
                  shouldn't be linked to Shopify orders
                </li>
              </ul>
              <p>
                Checked in orders will be skipped during order processing, 
                and will not appear in picklists or backorder reports.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Awaiting Orders List */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-500">
            <AlertCircle className="mr-2 h-5 w-5" />
            Awaiting Orders
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Orders waiting to be checked in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AwaitingOrdersList 
            onCheckInOrder={addExclusion}
            excludedOrderNumbers={excludedOrderNumbers}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Exclusion List */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-500">
            <Check className="mr-2 h-5 w-5" />
            Checked In Orders
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Currently checked in order numbers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExcludeOrderList 
            excludedOrders={excludedOrders} 
            isLoading={isLoading} 
            onRemoveExclusion={removeExclusion} 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default LineItemsExclude;
