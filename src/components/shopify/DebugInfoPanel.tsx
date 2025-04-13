
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface DebugInfoPanelProps {
  debugInfo: string[];
}

const DebugInfoPanel = ({ debugInfo }: DebugInfoPanelProps) => {
  const [copied, setCopied] = useState(false);
  
  // Filter for different message types to highlight them
  const errorMessages = debugInfo.filter(msg => 
    msg.includes("ERROR") || 
    msg.includes("error") || 
    msg.includes("failed") || 
    msg.includes("Failed") ||
    msg.includes("Exception")
  );
  
  const warningMessages = debugInfo.filter(msg => 
    msg.includes("WARNING") || 
    msg.includes("warning") ||
    msg.includes("timeout") ||
    msg.includes("Timeout")
  );
  
  const successMessages = debugInfo.filter(msg => 
    msg.includes("SUCCESS") || 
    msg.includes("success") || 
    msg.includes("completed successfully")
  );
  
  // Handle copy all debug info to clipboard
  const handleCopyAll = () => {
    navigator.clipboard.writeText(debugInfo.join('\n'))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  };
  
  // Group messages by operation for better readability
  const operationMessages = {
    cleanup: debugInfo.filter(msg => 
      msg.includes("cleanup") || 
      msg.includes("Cleanup") || 
      msg.includes("STEP 1")
    ),
    import: debugInfo.filter(msg => 
      msg.includes("import") || 
      msg.includes("Import") || 
      msg.includes("STEP 2")
    ),
    other: debugInfo.filter(msg => 
      !msg.includes("cleanup") && 
      !msg.includes("Cleanup") && 
      !msg.includes("import") && 
      !msg.includes("Import") &&
      !msg.includes("STEP")
    )
  };
  
  // Helper function to render a message with appropriate styling
  const renderMessage = (message: string, index: number, type: string) => {
    let className = "text-xs font-mono whitespace-pre-wrap ";
    
    if (message.includes("ERROR") || message.includes("error") || message.includes("failed") || message.includes("Failed")) {
      className += "text-red-400";
    } else if (message.includes("WARNING") || message.includes("warning") || message.includes("timeout") || message.includes("Timeout")) {
      className += "text-yellow-400";
    } else if (message.includes("SUCCESS") || message.includes("success") || message.includes("completed successfully")) {
      className += "text-green-400";
    } else {
      className += "text-zinc-400";
    }
    
    // Add timestamp to the message
    const timestamp = message.match(/\[\d{2}:\d{2}:\d{2}\]/);
    if (timestamp) {
      return (
        <p key={`${type}-${index}`} className={className}>
          <span className="text-zinc-500">{timestamp[0]}</span> {message.replace(timestamp[0], '')}
        </p>
      );
    }
    
    return <p key={`${type}-${index}`} className={className}>{message}</p>;
  };
  
  // Show the most recent messages first (they're already in reverse chronological order)
  return (
    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-md p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-zinc-300">Debug Information</h3>
        <Button 
          onClick={handleCopyAll} 
          variant="outline" 
          size="sm" 
          className="h-7 text-xs"
        >
          {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
          {copied ? 'Copied!' : 'Copy All'}
        </Button>
      </div>
      
      {/* Show error messages at the top if any exist */}
      {errorMessages.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium mb-1 text-red-400">Errors ({errorMessages.length}):</h4>
          <ScrollArea className="h-[100px] rounded-md border border-red-900/30 bg-red-950/20 p-2">
            <div className="space-y-1">
              {errorMessages.map((message, index) => renderMessage(message, index, 'error'))}
            </div>
          </ScrollArea>
        </div>
      )}
      
      {/* Show warning messages if any exist */}
      {warningMessages.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium mb-1 text-yellow-400">Warnings ({warningMessages.length}):</h4>
          <ScrollArea className="h-[80px] rounded-md border border-yellow-900/30 bg-yellow-950/20 p-2">
            <div className="space-y-1">
              {warningMessages.map((message, index) => renderMessage(message, index, 'warning'))}
            </div>
          </ScrollArea>
        </div>
      )}
      
      {/* Show success messages if any exist */}
      {successMessages.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium mb-1 text-green-400">Success ({successMessages.length}):</h4>
          <ScrollArea className="h-[80px] rounded-md border border-green-900/30 bg-green-950/20 p-2">
            <div className="space-y-1">
              {successMessages.map((message, index) => renderMessage(message, index, 'success'))}
            </div>
          </ScrollArea>
        </div>
      )}
      
      {/* Show all messages */}
      <h4 className="text-xs font-medium mb-1 text-zinc-300">All Logs ({debugInfo.length}):</h4>
      <ScrollArea className="h-[200px] rounded-md border border-zinc-700/50 bg-zinc-900/50 p-2">
        <div className="space-y-1">
          {debugInfo.map((message, index) => renderMessage(message, index, 'all'))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DebugInfoPanel;
