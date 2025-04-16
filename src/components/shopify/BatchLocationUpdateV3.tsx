
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useBatchLocationUpdate } from './hooks/useBatchLocationUpdate';

interface BatchLocationUpdateV3Props {
  disabled?: boolean;
  onUpdateComplete?: () => Promise<void>;
}

const BatchLocationUpdateV3: React.FC<BatchLocationUpdateV3Props> = ({ 
  disabled = false,
  onUpdateComplete
}) => {
  const { state, handleBatchUpdate } = useBatchLocationUpdate(disabled, onUpdateComplete);

  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-orange-500">Batch Location Update</CardTitle>
        <CardDescription className="text-zinc-400">
          Update location information for all line items using the GraphQL API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {disabled && (
          <Alert className="bg-amber-900/20 border-amber-500/50">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <AlertTitle className="text-amber-400">Operation Locked</AlertTitle>
            <AlertDescription className="text-zinc-300">
              A data refresh is currently in progress. Please wait until it completes before 
              attempting to update locations.
            </AlertDescription>
          </Alert>
        )}
      
        {state.isUpdating && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm text-zinc-400">
              <span>{state.updatedCount} items updated</span>
              <span>{state.timeElapsed.toFixed(1)}s elapsed</span>
            </div>
            <Progress value={state.progressPercent} className="h-2" />
            {state.estimatedTotal > 0 && (
              <div className="text-xs text-zinc-500">
                Progress: approximately {state.progressPercent}% complete 
                ({state.totalProcessed}/{state.estimatedTotal} estimated items)
              </div>
            )}
          </div>
        )}
        
        <Button 
          onClick={handleBatchUpdate}
          disabled={disabled || state.isUpdating}
          className="w-full"
          variant={state.isComplete ? "outline" : "default"}
        >
          {state.isUpdating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Updating Locations...
            </>
          ) : state.isComplete ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
              Run Again
            </>
          ) : (
            "Update All Locations"
          )}
        </Button>
        
        {state.message && (
          <Alert className="bg-red-900/20 border-red-500/50">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <AlertTitle className="text-red-400">Error</AlertTitle>
            <AlertDescription className="text-zinc-300">
              {state.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default BatchLocationUpdateV3;
