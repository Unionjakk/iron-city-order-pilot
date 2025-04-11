
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, MapPin, RefreshCw, HelpCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Code } from '@/components/ui/code';
import DebugInfoPanel from './DebugInfoPanel';
import { getTokenFromDatabase } from './services/importService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
      setError('Both Order ID and Line Item ID are required to identify a specific line item in Shopify');
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
      
      // Prepare request details
      const body = { 
        apiToken: token,
        mode: "single",
        orderId: orderId,
        lineItemId: lineItemId
      };
      
      // Get the correct URL for the edge function
      const edgeFunctionUrl = "https://hbmismnzmocjazaiicdu.supabase.co/functions/v1/shopify-locations-sync";
      addDebugMessage(`Calling Edge Function: ${edgeFunctionUrl}`);
      addDebugMessage(`Request payload: ${JSON.stringify({...body, apiToken: "[REDACTED]"}, null, 2)}`);
      
      setRequestDetails({
        url: edgeFunctionUrl,
        body: {
          ...body,
          apiToken: "[REDACTED]"
        }
      });
      
      // Call the edge function with improved error handling
      const fetchResponse = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });
      
      addDebugMessage(`Edge function response status: ${fetchResponse.status} ${fetchResponse.statusText}`);
      
      // Get response as text first to ensure we can handle malformed JSON
      const responseText = await fetchResponse.text();
      addDebugMessage(`Response text length: ${responseText.length}`);
      addDebugMessage(`Response text preview: ${responseText.substring(0, 300)}${responseText.length > 300 ? '...' : ''}`);
      
      let responseJson;
      try {
        // Only try to parse if we have content
        if (responseText.trim()) {
          responseJson = JSON.parse(responseText);
          addDebugMessage("Successfully parsed JSON response");
        } else {
          addDebugMessage("Warning: Empty response received");
          responseJson = { error: "Empty response from server" };
        }
      } catch (err: any) {
        addDebugMessage(`Error parsing JSON: ${err.message}`);
        responseJson = { 
          error: "Invalid JSON response", 
          rawText: responseText.substring(0, 150) + (responseText.length > 150 ? "..." : "") 
        };
      }
      
      setResponseData({
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        data: responseJson
      });
      
      if (!fetchResponse.ok) {
        throw new Error(`Edge function error: ${fetchResponse.status} ${fetchResponse.statusText} - ${responseJson?.error || 'Unknown error'}`);
      }
      
      if (!responseJson || !responseJson.success) {
        // Extract and display the error message from the response
        const errorMessage = responseJson?.error || responseJson?.debugMessages?.find((msg: string) => 
          msg.includes("Error") || msg.includes("error")
        ) || "Unknown error from edge function";
        
        throw new Error(errorMessage);
      }
      
      // Add debug messages from the edge function if available
      if (responseJson.debugMessages && Array.isArray(responseJson.debugMessages)) {
        responseJson.debugMessages.forEach((message: string) => {
          addDebugMessage(`Edge function: ${message}`);
        });
      }
      
      addDebugMessage(`Successfully updated line item location info`);
      
      // Notify user
      toast({
        title: "Location Info Updated",
        description: "Successfully updated location for the line item",
        variant: "default",
      });
      
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
        <Alert className="bg-amber-900/20 border-amber-500/50">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <AlertTitle className="text-amber-400">How It Works</AlertTitle>
          <AlertDescription className="text-zinc-300">
            <p className="mb-2">This tool connects to the Shopify API to update location information for a single line item:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Enter both the Shopify Order ID and Line Item ID (both are required)</li>
              <li>The system calls our edge function which connects to the Shopify API</li>
              <li>Line item location information is fetched and updated in our database</li>
            </ol>
          </AlertDescription>
        </Alert>
        
        <Alert className="bg-blue-900/20 border-blue-500/50">
          <AlertTriangle className="h-5 w-5 text-blue-500" />
          <AlertTitle className="text-blue-400">Technical Note</AlertTitle>
          <AlertDescription className="text-zinc-300">
            <p className="mb-2 text-sm flex items-center">
              <ExternalLink className="h-4 w-4 mr-1" /> The Edge Function calls Shopify API at: 
              <Code className="ml-2 text-xs">https://opus-harley-davidson.myshopify.com/admin/api/2023-07/orders/{'{order_id}'}.json</Code>
            </p>
            <p className="text-sm">Both IDs must match exactly what's in Shopify. Check both IDs carefully if you get errors.</p>
          </AlertDescription>
        </Alert>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="orderId" className="flex items-center">
                Shopify Order ID
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="ml-1 h-4 w-4 text-zinc-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">The Shopify Order ID (usually a long number like 5212345678901)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="orderId"
                placeholder="e.g. 5212345678901"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="bg-zinc-950/50 border-zinc-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lineItemId" className="flex items-center">
                Line Item ID
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="ml-1 h-4 w-4 text-zinc-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">The specific Line Item ID within the order (also a long number)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
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
            <h4 className="text-orange-500 text-sm font-medium">API Request Flow</h4>
            <div className="text-sm text-zinc-400 mb-2">
              <p>1. Frontend → Edge Function: <Code className="text-xs">{requestDetails.url}</Code></p>
              <p>2. Edge Function → Shopify API: <Code className="text-xs">https://opus-harley-davidson.myshopify.com/admin/api/2023-07/orders/{orderId}.json</Code></p>
            </div>
            <div>
              <span className="text-xs text-zinc-500">Request Body (to Edge Function):</span>
              <Code className="mt-1 text-emerald-400 whitespace-pre overflow-x-auto">
                {JSON.stringify(requestDetails.body, null, 2)}
              </Code>
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
