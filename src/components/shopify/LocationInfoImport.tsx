
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, MapPin } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DebugInfoPanel from './DebugInfoPanel';

interface LocationInfoImportProps {
  onImportComplete: () => Promise<void>;
}

const LocationInfoImport = ({ onImportComplete }: LocationInfoImportProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Function to get token from database
  const getTokenFromDatabase = async () => {
    try {
      const { data, error } = await supabase.rpc('get_shopify_setting', { 
        setting_name_param: 'shopify_token' 
      });
      
      if (error) {
        console.error('Error retrieving token from database:', error);
        return null;
      }
      
      if (data && typeof data === 'string' && data !== 'placeholder_token') {
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Exception retrieving token:', error);
      return null;
    }
  };

  // Handle import location info
  const handleImportLocationInfo = async () => {
    setIsImporting(true);
    setError(null);
    setDebugInfo([]);
    
    try {
      // Add debug message
      const addDebugMessage = (message: string) => {
        setDebugInfo(prev => [...prev, message]);
      };
      
      addDebugMessage("Starting location info import process...");
      
      // Get API token
      const token = await getTokenFromDatabase();
      
      if (!token) {
        throw new Error("No API token found in database. Please add your Shopify API token first.");
      }
      
      addDebugMessage("API token retrieved from database");
      
      // Call the edge function to update location information
      addDebugMessage("Calling Shopify locations sync Edge Function...");
      
      const response = await supabase.functions.invoke('shopify-locations-sync', {
        body: { apiToken: token }
      });
      
      if (response.error) {
        console.error('Error invoking shopify-locations-sync function:', response.error);
        throw new Error(`Failed to connect to Shopify API: ${response.error.message || 'Unknown error'}`);
      }
      
      const data = response.data;
      
      if (!data || !data.success) {
        const errorMsg = data?.error || 'Unknown error occurred during location info sync';
        console.error('Location info sync failed:', errorMsg);
        throw new Error(`Location info sync failed: ${errorMsg}`);
      }
      
      // Add debug messages from the edge function
      if (data.debugMessages && Array.isArray(data.debugMessages)) {
        data.debugMessages.forEach((message: string) => {
          addDebugMessage(message);
        });
      }
      
      addDebugMessage(`Successfully updated location information for ${data.updated} line items`);
      
      // Notify user
      toast({
        title: "Location Info Updated",
        description: `Successfully updated location information for ${data.updated} line items`,
        variant: "default",
      });
      
      // Refresh data
      await onImportComplete();
    } catch (error: any) {
      console.error('Error importing location info:', error);
      setError(error.message || 'Unknown error during location import');
      setDebugInfo(prev => [...prev, `ERROR: ${error.message || 'Unknown error'}`]);
      
      toast({
        title: "Import Failed",
        description: "Failed to import location information. See error details.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm mt-4">
      <CardHeader>
        <CardTitle className="text-blue-500 flex items-center">
          <MapPin className="mr-2 h-5 w-5" /> Location Information Import
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Update location data for existing line items
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-blue-900/20 border-blue-500/50">
          <AlertCircle className="h-5 w-5 text-blue-500" />
          <AlertTitle className="text-blue-400">API Permissions Required</AlertTitle>
          <AlertDescription className="text-zinc-300">
            Make sure your Shopify API token has the <strong>read_locations</strong> and <strong>read_assigned_fulfillment_orders</strong> permissions 
            enabled in the Shopify Admin API access scopes. This operation will query the Shopify API for each 
            line item to retrieve its location information.
          </AlertDescription>
        </Alert>
        
        <Button 
          onClick={handleImportLocationInfo} 
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={isImporting}
        >
          {isImporting ? (
            <>
              <MapPin className="mr-2 h-4 w-4 animate-pulse" />
              Importing Location Data...
            </>
          ) : (
            <>
              <MapPin className="mr-2 h-4 w-4" />
              Import Location Information
            </>
          )}
        </Button>
        
        {error && (
          <Alert className="bg-red-900/20 border-red-500/50">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <AlertTitle className="text-red-400">Error</AlertTitle>
            <AlertDescription className="text-zinc-300">
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        <DebugInfoPanel debugInfo={debugInfo} />
      </CardContent>
    </Card>
  );
};

export default LocationInfoImport;
