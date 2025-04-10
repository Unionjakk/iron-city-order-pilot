
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ImportErrorAlert from './ImportErrorAlert';
import RefreshButton from './RefreshButton';
import DebugInfoPanel from './DebugInfoPanel';
import { useCompleteRefresh } from './hooks/useCompleteRefresh';

interface CompleteRefreshProps {
  onRefreshComplete: () => Promise<void>;
}

const CompleteRefresh = ({ onRefreshComplete }: CompleteRefreshProps) => {
  const {
    isDeleting,
    isImporting,
    debugInfo,
    error,
    handleCompleteRefresh,
    setError
  } = useCompleteRefresh({ onRefreshComplete });

  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-red-500">Complete Data Refresh</CardTitle>
        <CardDescription className="text-zinc-400">
          Delete all existing orders and re-import from Shopify
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-red-900/20 border-red-500/50">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <AlertTitle className="text-red-400">Warning: Destructive Operation</AlertTitle>
          <AlertDescription className="text-zinc-300">
            This will delete ALL current orders and import them fresh from Shopify. 
            This is useful if your local data is out of sync with Shopify. 
            This operation cannot be undone.
          </AlertDescription>
        </Alert>
        
        <RefreshButton 
          isDeleting={isDeleting}
          isImporting={isImporting}
          onClick={handleCompleteRefresh}
        />
        
        {error && (
          <ImportErrorAlert 
            error={error} 
            onDismiss={() => setError(null)}
          />
        )}
        
        <DebugInfoPanel debugInfo={debugInfo} />
      </CardContent>
    </Card>
  );
};

export default CompleteRefresh;
