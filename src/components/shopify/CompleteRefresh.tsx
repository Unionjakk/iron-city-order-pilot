
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import ImportErrorAlert from './ImportErrorAlert';
import RefreshButton from './RefreshButton';
import DebugInfoPanel from './DebugInfoPanel';
import { useCompleteRefresh } from './hooks/useCompleteRefresh';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CompleteRefreshProps {
  onRefreshComplete: () => Promise<void>;
}

const CompleteRefresh = ({ onRefreshComplete }: CompleteRefreshProps) => {
  const {
    isDeleting,
    isImporting,
    debugInfo,
    error,
    isRecoveryMode,
    handleCompleteRefresh,
    handleRecoveryImport,
    setError,
    setIsRecoveryMode
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
        {isRecoveryMode ? (
          <Alert className="bg-amber-900/20 border-amber-500/50">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <AlertTitle className="text-amber-400">Recovery Mode</AlertTitle>
            <AlertDescription className="text-zinc-300">
              The database was cleaned but import failed. You can try to import again without deleting data.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-red-900/20 border-red-500/50">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <AlertTitle className="text-red-400">Warning: Destructive Operation</AlertTitle>
            <AlertDescription className="text-zinc-300">
              This will delete ALL current orders and import them fresh from Shopify. 
              This is useful if your local data is out of sync with Shopify. 
              This operation cannot be undone.
            </AlertDescription>
          </Alert>
        )}
        
        {isRecoveryMode ? (
          <div className="space-y-4">
            <Button 
              onClick={handleRecoveryImport}
              className="w-full bg-amber-600 hover:bg-amber-700"
              disabled={isImporting}
            >
              {isImporting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Importing All Orders...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Import All Orders (Recovery Mode)
                </>
              )}
            </Button>
            <Button 
              onClick={() => setIsRecoveryMode(false)}
              variant="outline"
              className="w-full"
              disabled={isImporting}
            >
              Exit Recovery Mode
            </Button>
          </div>
        ) : (
          <RefreshButton 
            isDeleting={isDeleting}
            isImporting={isImporting}
            onClick={handleCompleteRefresh}
          />
        )}
        
        {error && (
          <ImportErrorAlert 
            error={error} 
            onDismiss={() => setError(null)}
            enableRecovery={!isRecoveryMode && debugInfo.some(msg => msg.includes("Database successfully cleaned"))}
            onEnableRecovery={() => setIsRecoveryMode(true)}
          />
        )}
        
        <Tabs defaultValue="live" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="live">Live Log</TabsTrigger>
            <TabsTrigger value="debug">Debug Details</TabsTrigger>
          </TabsList>
          <TabsContent value="live" className="pt-2">
            <DebugInfoPanel debugInfo={debugInfo.slice(0, 10)} />
          </TabsContent>
          <TabsContent value="debug" className="pt-2">
            <DebugInfoPanel debugInfo={debugInfo} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CompleteRefresh;
