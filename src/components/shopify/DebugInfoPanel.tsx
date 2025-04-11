
import React, { useState } from 'react';
import { Code } from '@/components/ui/code';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Code as CodeIcon, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DebugInfoPanelProps {
  debugInfo: string[];
}

const DebugInfoPanel: React.FC<DebugInfoPanelProps> = ({ debugInfo }) => {
  if (debugInfo.length === 0) return null;
  
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const { toast } = useToast();
  
  const toggleItem = (index: number) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "Debug information copied to clipboard",
          variant: "default",
        });
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        toast({
          title: "Copy failed",
          description: "Could not copy text to clipboard",
          variant: "destructive",
        });
      });
  };
  
  const isJsonData = (message: string) => {
    return message.startsWith('RAW JSON RESPONSE:') || 
           message.startsWith('RAW ORDER DATA:') || 
           message.startsWith('RAW FULFILLMENTS DATA:') ||
           message.startsWith('API URL:') ||
           message.startsWith('API RESPONSE:') ||
           message.startsWith('API REQUEST:');
  };
  
  const extractJson = (message: string): string => {
    try {
      // Extract the JSON part of the message
      const jsonStr = message.substring(message.indexOf(':') + 1).trim();
      
      // For API URLs, just return the URL string
      if (message.startsWith('API URL:')) {
        return jsonStr;
      }
      
      // Parse and stringify for pretty formatting
      const parsedJson = JSON.parse(jsonStr);
      return JSON.stringify(parsedJson, null, 2);
    } catch (e) {
      // If parsing fails, just return the original message
      return message.substring(message.indexOf(':') + 1).trim();
    }
  };
  
  return (
    <div className="mt-4 border border-zinc-800 rounded-md p-2 bg-zinc-950/50">
      <h4 className="text-orange-500 text-sm font-medium mb-2 flex justify-between items-center">
        <span>Debug Information</span>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 text-xs"
          onClick={() => copyToClipboard(debugInfo.join('\n'))}
        >
          <Copy size={14} className="mr-1" /> Copy All
        </Button>
      </h4>
      <div className="max-h-96 overflow-y-auto text-xs font-mono">
        {debugInfo.map((message, index) => (
          <React.Fragment key={index}>
            {isJsonData(message) ? (
              <Collapsible 
                className="py-1 border-b border-zinc-800 last:border-0"
                open={expandedItems[index]}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-1 h-auto"
                        onClick={() => toggleItem(index)}
                      >
                        {expandedItems[index] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </Button>
                    </CollapsibleTrigger>
                    <div 
                      className="flex items-center cursor-pointer text-orange-400"
                      onClick={() => toggleItem(index)}
                    >
                      <CodeIcon size={14} className="mr-1" />
                      <span>
                        {message.substring(0, message.indexOf(':'))} (click to {expandedItems[index] ? 'collapse' : 'expand'})
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-1 h-6 text-xs"
                    onClick={() => copyToClipboard(extractJson(message))}
                  >
                    <Copy size={12} />
                  </Button>
                </div>
                <CollapsibleContent>
                  <Code className="mt-2 p-2 max-h-64 overflow-auto text-xs">
                    {extractJson(message)}
                  </Code>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <div className="py-1 border-b border-zinc-800 last:border-0">
                <span className="text-zinc-500">[{new Date().toISOString().substring(11, 19)}]</span>{' '}
                <span className="text-zinc-300">{message}</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default DebugInfoPanel;
