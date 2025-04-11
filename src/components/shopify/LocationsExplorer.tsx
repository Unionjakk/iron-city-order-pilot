
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Map, Code as CodeIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DebugInfoPanel from './DebugInfoPanel';
import { Code } from '@/components/ui/code';

const LocationsExplorer = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<any[]>([]);
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

  // Handle fetch locations
  const handleFetchLocations = async () => {
    setIsLoading(true);
    setError(null);
    setDebugInfo([]);
    setLocations([]);
    
    try {
      // Add debug message
      const addDebugMessage = (message: string) => {
        setDebugInfo(prev => [...prev, message]);
      };
      
      addDebugMessage("Starting location info fetch...");
      
      // Get API token
      const token = await getTokenFromDatabase();
      
      if (!token) {
        throw new Error("No API token found in database. Please add your Shopify API token first.");
      }
      
      addDebugMessage("API token retrieved from database");
      
      // Call the edge function to fetch locations
      addDebugMessage("Calling Shopify locations sync Edge Function to fetch locations...");
      
      const response = await supabase.functions.invoke('shopify-locations-sync', {
        body: { 
          apiToken: token,
          mode: 'list_locations'
        }
      });
      
      if (response.error) {
        console.error('Error invoking shopify-locations-sync function:', response.error);
        throw new Error(`Failed to connect to Shopify API: ${response.error.message || 'Unknown error'}`);
      }
      
      const data = response.data;
      
      if (!data || !data.success) {
        const errorMsg = data?.error || 'Unknown error occurred during location fetch';
        console.error('Location fetch failed:', errorMsg);
        throw new Error(`Location fetch failed: ${errorMsg}`);
      }
      
      // Add debug messages from the edge function
      if (data.debugMessages && Array.isArray(data.debugMessages)) {
        data.debugMessages.forEach((message: string) => {
          addDebugMessage(message);
        });
      }
      
      // Set locations
      if (data.locations && Array.isArray(data.locations)) {
        setLocations(data.locations);
        addDebugMessage(`Successfully fetched ${data.locations.length} locations`);
      } else {
        addDebugMessage("No locations returned from API");
      }
      
      // Notify user
      toast({
        title: "Locations Fetched",
        description: `Successfully fetched ${data.locations?.length || 0} locations from Shopify`,
        variant: "default",
      });
      
    } catch (error: any) {
      console.error('Error fetching locations:', error);
      setError(error.message || 'Unknown error during location fetch');
      setDebugInfo(prev => [...prev, `ERROR: ${error.message || 'Unknown error'}`]);
      
      toast({
        title: "Fetch Failed",
        description: "Failed to fetch location information. See error details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm mt-4">
      <CardHeader>
        <CardTitle className="text-green-500 flex items-center">
          <Map className="mr-2 h-5 w-5" /> Shopify Locations Explorer
        </CardTitle>
        <CardDescription className="text-zinc-400">
          View all locations available in your Shopify store
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleFetchLocations} 
          className="w-full bg-green-600 hover:bg-green-700"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Map className="mr-2 h-4 w-4 animate-pulse" />
              Fetching Locations...
            </>
          ) : (
            <>
              <Map className="mr-2 h-4 w-4" />
              Fetch All Shopify Locations
            </>
          )}
        </Button>
        
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-md text-sm text-red-300">
            {error}
          </div>
        )}
        
        {locations.length > 0 && (
          <div className="border border-zinc-800 rounded-md p-4 mt-4 bg-zinc-950/50">
            <div className="flex items-center mb-3">
              <CodeIcon className="text-green-500 mr-2 h-4 w-4" />
              <h3 className="text-sm font-medium text-green-500">
                Found {locations.length} Locations in Shopify
              </h3>
            </div>
            <Code className="p-4 max-h-96 overflow-auto">
              {JSON.stringify(locations, null, 2)}
            </Code>
          </div>
        )}
        
        <DebugInfoPanel debugInfo={debugInfo} />
      </CardContent>
    </Card>
  );
};

export default LocationsExplorer;
