
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, MapPin, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Code } from '@/components/ui/code';
import DebugInfoPanel from './DebugInfoPanel';
import { getTokenFromDatabase } from './services/importService';

interface SingleLineItemLocationUpdateProps {
  onUpdateComplete: () => Promise<void>;
}

const SingleLineItemLocationUpdate: React.FC<SingleLineItemLocationUpdateProps> = ({ onUpdateComplete }) => {
  const [orderId, setOrderId] = useState('');
  const [lineItemId, setLineItemId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<{url?: string; body?: any}>({});
  const [responseData, setResponseData] = useState<any>(null);
  const { toast } = useToast();

  // Handle update for single line item
  const handleUpdateSingleItem = async () => {
    if (!orderId.trim() || !lineItemId.trim()) {
      setError('Both Order ID and Line Item ID are required');
      return;
    }

    setIsUpdating(true);
    setError(null);
    setDebugInfo([]);
    setRequestDetails({});
    setResponseData(null);
    
    try {
      // Add debug message
      const addDebugMessage = (message: string) => {
        setDebugInfo(prev => [...prev, message]);
      };
      
      addDebugMessage(`Starting location update for Order ID: ${orderId}, Line Item ID: ${lineItemId}`);
      
      // Get API token
      const token = await getTokenFromDatabase();
      
      if (!token) {
        throw new Error("No API token found in database. Please add your Shopify API token first.");
      }
      
      addDebugMessage("API token retrieved from database");
      addDebugMessage(`Token format: ${typeof token}, length: ${token.length}`);
      
      // Prepare request details
      const body = { 
        apiToken: token,
        mode: "single",
        orderId: orderId,
        lineItemId: lineItemId
      };
      
      // Using the hardcoded URL to avoid protected property access
      const requestUrl = `${window.location.origin}/functions/v1/shopify-locations-sync`;
      addDebugMessage(`Generated request URL: ${requestUrl}`);
      
      // Fall back to hardcoded URL if needed
      const fallbackUrl = "https://hbmismnzmocjazaiicdu.supabase.co/functions/v1/shopify-locations-sync";
      addDebugMessage(`Using fallback URL if needed: ${fallbackUrl}`);
      
      const finalUrl = requestUrl.includes('functions/v1') ? requestUrl : fallbackUrl;
      
      setRequestDetails({
        url: finalUrl,
        body: body
      });
      
      addDebugMessage(`Calling Edge Function: ${finalUrl}`);
      addDebugMessage(`Request payload: ${JSON.stringify(body, null, 2).replace(token, "[REDACTED]")}`);
      
      // Call the edge function directly with a fetch request for more control
      try {
        addDebugMessage("Attempting direct fetch to edge function...");
        
        const fetchResponse = await fetch(finalUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabase.auth.getSession() ? 'session_token' : 'no_session'}`
          },
          body: JSON.stringify(body)
        });
        
        addDebugMessage(`Direct fetch response status: ${fetchResponse.status}`);
        
        const responseText = await fetchResponse.text();
        addDebugMessage(`Response text (first 100 chars): ${responseText.substring(0, 100)}...`);
        
        let responseJson;
        try {
          responseJson = JSON.parse(responseText);
          addDebugMessage("Successfully parsed JSON response");
        } catch (err) {
          addDebugMessage(`Error parsing JSON: ${err}`);
          responseJson = { error: "Invalid JSON response", rawText: responseText.substring(0, 100) + "..." };
        }
        
        setResponseData({
          status: fetchResponse.status,
          statusText: fetchResponse.statusText,
          data: responseJson
        });
        
        if (!fetchResponse.ok) {
          throw new Error(`Edge function error: ${fetchResponse.status} ${fetchResponse.statusText}`);
        }
        
        if (!responseJson.success) {
          throw new Error(responseJson.error || "Unknown error from edge function");
        }
        
        addDebugMessage(`Successfully updated line item location info`);
        
        // Notify user
        toast({
          title: "Location Info Updated",
          description: "Successfully updated location for the line item",
          variant: "default",
        });
        
      } catch (directFetchError: any) {
        addDebugMessage(`Direct fetch failed: ${directFetchError.message}`);
        addDebugMessage("Falling back to supabase.functions.invoke...");
        
        // Fall back to supabase.functions.invoke
        const response = await supabase.functions.invoke('shopify-locations-sync', {
          body: body
        });
        
        // Store full response for display
        setResponseData(response);
        
        if (response.error) {
          console.error('Error invoking shopify-locations-sync function:', response.error);
          addDebugMessage(`Error from Edge Function: ${response.error.message || 'Unknown error'}`);
          throw new Error(`Failed to connect to Shopify API: ${response.error.message || 'Unknown error'}`);
        }
        
        const data = response.data;
        addDebugMessage(`Response received: ${JSON.stringify(data, null, 2)}`);
        
        if (!data || !data.success) {
          const errorMsg = data?.error || 'Unknown error occurred during location info sync';
          console.error('Location info sync failed:', errorMsg);
          addDebugMessage(`Location sync failed: ${errorMsg}`);
          throw new Error(`Location info sync failed: ${errorMsg}`);
        }
        
        // Add debug messages from the edge function
        if (data.debugMessages && Array.isArray(data.debugMessages)) {
          data.debugMessages.forEach((message: string) => {
            addDebugMessage(message);
          });
        }
        
        const resultMessage = data.updated > 0 
          ? `Successfully updated location for line item ${lineItemId}`
          : 'Operation completed but no updates were made';
        
        addDebugMessage(resultMessage);
        
        // Notify user
        toast({
          title: "Location Info Updated",
          description: resultMessage,
          variant: "default",
        });
      }
      
      // Refresh data
      await onUpdateComplete();
    } catch (error: any) {
      console.error('Error updating location info:', error);
      setError(error.message || 'Unknown error during location update');
      setDebugInfo(prev => [...prev, `ERROR: ${error.message || 'Unknown error'}`]);
      
      toast({
        title: "Update Failed",
        description: "Failed to update location information. See error details.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm mt-4">
      <CardHeader>
        <CardTitle className="text-green-500 flex items-center">
          <MapPin className="mr-2 h-5 w-5" /> Single Line Item Location Update
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Update location data for a specific line item by providing Order ID and Line Item ID
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="orderId">Shopify Order ID</Label>
              <Input
                id="orderId"
                placeholder="e.g. 5212345678901"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="bg-zinc-950/50 border-zinc-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lineItemId">Line Item ID</Label>
              <Input
                id="lineItemId"
                placeholder="e.g. 12345678901234"
                value={lineItemId}
                onChange={(e) => setLineItemId(e.target.value)}
                className="bg-zinc-950/50 border-zinc-800"
              />
            </div>
          </div>
          
          <Button 
            onClick={handleUpdateSingleItem} 
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Updating Location...
              </>
            ) : (
              <>
                <MapPin className="mr-2 h-4 w-4" />
                Update Location Information
              </>
            )}
          </Button>
        </div>
        
        {error && (
          <Alert className="bg-red-900/20 border-red-500/50">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <AlertTitle className="text-red-400">Error</AlertTitle>
            <AlertDescription className="text-zinc-300">
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        {requestDetails.url && (
          <div className="space-y-2">
            <h4 className="text-orange-500 text-sm font-medium">API Request Details</h4>
            <div className="space-y-2">
              <div>
                <span className="text-xs text-zinc-500">Endpoint URL:</span>
                <Code className="mt-1 text-blue-400">{requestDetails.url}</Code>
              </div>
              <div>
                <span className="text-xs text-zinc-500">Request Body:</span>
                <Code className="mt-1 text-emerald-400 whitespace-pre overflow-x-auto">
                  {JSON.stringify({...requestDetails.body, apiToken: "[REDACTED]"}, null, 2)}
                </Code>
              </div>
            </div>
          </div>
        )}
        
        {responseData && (
          <div className="space-y-2">
            <h4 className="text-orange-500 text-sm font-medium">API Response</h4>
            <div className="space-y-1">
              <span className="text-xs text-zinc-500">Status: {responseData.status || 'Unknown'}</span>
              <Code className="mt-1 text-amber-400 whitespace-pre overflow-x-auto">
                {JSON.stringify(responseData.data, null, 2)}
              </Code>
            </div>
          </div>
        )}
        
        <DebugInfoPanel debugInfo={debugInfo} />
      </CardContent>
    </Card>
  );
};

export default SingleLineItemLocationUpdate;
