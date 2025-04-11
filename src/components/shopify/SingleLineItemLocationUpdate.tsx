
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, MapPin, RefreshCw, HelpCircle } from 'lucide-react';
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
      addDebugMessage(`Token format: ${typeof token}, length: ${token.length}`);
      
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
      
      // Call the edge function directly
      const fetchResponse = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      
      // Add debug messages from the edge function if available
      if (responseJson.debugMessages && Array.isArray(responseJson.debugMessages)) {
        responseJson.debugMessages.forEach((message: string) => {
          addDebugMessage(message);
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
          <AlertTitle className="text-amber-400">Why Both IDs?</AlertTitle>
          <AlertDescription className="text-zinc-300">
            In Shopify's data structure, line items exist within orders. To identify a specific line item, 
            we need both the Order ID (to find the order) and the Line Item ID (to find the specific item within that order).
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
                      <p className="max-w-xs">The Shopify Order ID (usually a long number)</p>
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
                      <p className="max-w-xs">The specific Line Item ID within the order</p>
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
            <h4 className="text-orange-500 text-sm font-medium">API Request Details</h4>
            <div className="space-y-2">
              <div>
                <span className="text-xs text-zinc-500">Endpoint URL:</span>
                <Code className="mt-1 text-blue-400">{requestDetails.url}</Code>
              </div>
              <div>
                <span className="text-xs text-zinc-500">Request Body:</span>
                <Code className="mt-1 text-emerald-400 whitespace-pre overflow-x-auto">
                  {JSON.stringify(requestDetails.body, null, 2)}
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
