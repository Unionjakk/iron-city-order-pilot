
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Plus, AlertCircle, Info } from 'lucide-react';
import ExcludeLineItemForm from './components/ExcludeLineItemForm';
import ExcludeLineItemList from './components/ExcludeLineItemList';
import AwaitingLineItemsList from './components/AwaitingLineItemsList';
import { useExcludedLineItems } from './hooks/useExcludedLineItems';

const OpenLinesCheckIn = () => {
  const { 
    excludedLineItems, 
    isLoading, 
    addExclusion, 
    removeExclusion, 
    excludedLineItemKeys 
  } = useExcludedLineItems();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">Open Lines Check In</h1>
        <p className="text-orange-400/80">Check in and exclude specific line items</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Add New Exclusion */}
        <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-500">
              <Plus className="mr-2 h-5 w-5" />
              Add Line Item Check In
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Check in a specific line item to exclude from processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExcludeLineItemForm onAddExclusion={addExclusion} />
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-500">
              <Info className="mr-2 h-5 w-5" />
              About Line Item Check In
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Why check in line items?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-zinc-300">
              <p>
                Checking in line items provides more granular control than order-level check-ins.
                This is useful for:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <span className="font-semibold text-orange-400">Partial Orders:</span> Only check in 
                  specific line items while allowing the rest of the order to be processed
                </li>
                <li>
                  <span className="font-semibold text-orange-400">Backorder Management:</span> Handle 
                  individual backordered line items separately from the main order
                </li>
                <li>
                  <span className="font-semibold text-orange-400">Quality Control:</span> Mark specific 
                  line items that need physical verification before processing
                </li>
              </ul>
              <p>
                Checked in line items will be skipped during line item processing,
                and will not appear in detailed reports for those specific products.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Awaiting Line Items List */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-500">
            <AlertCircle className="mr-2 h-5 w-5" />
            Awaiting Line Items
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Line items waiting to be checked in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AwaitingLineItemsList 
            onCheckInLineItem={addExclusion}
            excludedLineItemKeys={excludedLineItemKeys}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Exclusion List */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-500">
            <Check className="mr-2 h-5 w-5" />
            Checked In Line Items
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Currently checked in line items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExcludeLineItemList 
            excludedLineItems={excludedLineItems} 
            isLoading={isLoading} 
            onRemoveExclusion={removeExclusion} 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default OpenLinesCheckIn;
