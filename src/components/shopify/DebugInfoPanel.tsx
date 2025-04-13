
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Copy, Check, ArrowDownCircle, X, FileDown, Database } from "lucide-react";
import { useState } from "react";

interface DebugInfoPanelProps {
  debugInfo: string[];
}

const DebugInfoPanel = ({ debugInfo }: DebugInfoPanelProps) => {
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);
  
  // Filter for different message types to highlight them
  const errorMessages = debugInfo.filter(msg => 
    msg.toLowerCase().includes("error") || 
    msg.toLowerCase().includes("failed") || 
    msg.toLowerCase().includes("exception") ||
    msg.toLowerCase().includes("could not delete")
  );
  
  const warningMessages = debugInfo.filter(msg => 
    msg.toLowerCase().includes("warning") || 
    msg.toLowerCase().includes("timeout") ||
    msg.toLowerCase().includes("taking longer")
  );
  
  const successMessages = debugInfo.filter(msg => 
    msg.toLowerCase().includes("success") || 
    msg.toLowerCase().includes("completed successfully")
  );
  
  // Filter for database operation messages
  const databaseMessages = debugInfo.filter(msg =>
    msg.toLowerCase().includes("database") ||
    msg.toLowerCase().includes("delete") ||
    msg.toLowerCase().includes("orders remain") ||
    msg.toLowerCase().includes("verified") ||
    msg.toLowerCase().includes("order items") ||
    msg.toLowerCase().includes("line items") ||
    msg.toLowerCase().includes("inserting")
  );
  
  // Filter for customer and shipping data messages
  const customerDataMessages = debugInfo.filter(msg =>
    msg.toLowerCase().includes("customer") ||
    msg.toLowerCase().includes("shipping") ||
    msg.toLowerCase().includes("address") ||
    msg.toLowerCase().includes("email") ||
    msg.toLowerCase().includes("phone")
  );
  
  // Filter for verification and counts messages
  const verificationMessages = debugInfo.filter(msg =>
    msg.toLowerCase().includes("count") ||
    msg.toLowerCase().includes("mismatch") ||
    msg.toLowerCase().includes("verified") ||
    msg.toLowerCase().includes("expected") ||
    msg.toLowerCase().includes("unfulfilled") ||
    msg.toLowerCase().includes("partial")
  );
  
  // Handle copy all debug info to clipboard
  const handleCopyAll = () => {
    navigator.clipboard.writeText(debugInfo.join('\n'))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  };
  
  // Handle download debug log as text file
  const handleDownloadLog = () => {
    const blob = new Blob([debugInfo.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shopify-import-log-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadReady(true);
    setTimeout(() => setDownloadReady(false), 2000);
  };
  
  // Helper function to render a message with appropriate styling
  const renderMessage = (message: string, index: number, type: string) => {
    let className = "text-xs font-mono whitespace-pre-wrap ";
    
    if (message.toLowerCase().includes("error") || message.toLowerCase().includes("failed") || message.toLowerCase().includes("exception")) {
      className += "text-red-400";
    } else if (message.toLowerCase().includes("warning") || message.toLowerCase().includes("timeout")) {
      className += "text-yellow-400";
    } else if (message.toLowerCase().includes("success") || message.toLowerCase().includes("completed successfully")) {
      className += "text-green-400";
    } else if (message.toLowerCase().includes("mismatch")) {
      className += "text-orange-400 font-semibold";
    } else if (message.toLowerCase().includes("verified") || message.toLowerCase().includes("data verified")) {
      className += "text-emerald-400 font-semibold";
    } else if (message.toLowerCase().includes("count") || message.toLowerCase().includes("expected")) {
      className += "text-cyan-400";
    } else if (message.toLowerCase().includes("delete") || message.toLowerCase().includes("deleting")) {
      className += "text-blue-400";
    } else if (message.toLowerCase().includes("insert") || message.toLowerCase().includes("importing")) {
      className += "text-purple-400";
    } else if (message.toLowerCase().includes("customer") || message.toLowerCase().includes("shipping")) {
      className += "text-cyan-400";
    } else {
      className += "text-zinc-400";
    }
    
    // Add timestamp to the message
    const timestamp = message.match(/\[[\d:]+\]/);
    if (timestamp) {
      return (
        <p key={`${type}-${index}`} className={className}>
          <span className="text-zinc-500">{timestamp[0]}</span> {message.replace(timestamp[0], '')}
        </p>
      );
    }
    
    return <p key={`${type}-${index}`} className={className}>{message}</p>;
  };
  
  return (
    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-md p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-zinc-300">Debug Information</h3>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setShowRaw(!showRaw)} 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs"
          >
            {showRaw ? <X className="h-3.5 w-3.5 mr-1" /> : <ArrowDownCircle className="h-3.5 w-3.5 mr-1" />}
            {showRaw ? 'Hide Raw Logs' : 'Show Raw Logs'}
          </Button>
          <Button 
            onClick={handleCopyAll} 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs"
          >
            {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
            {copied ? 'Copied!' : 'Copy All'}
          </Button>
          <Button 
            onClick={handleDownloadLog} 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs"
          >
            {downloadReady ? <Check className="h-3.5 w-3.5 mr-1" /> : <FileDown className="h-3.5 w-3.5 mr-1" />}
            {downloadReady ? 'Downloaded!' : 'Download Log'}
          </Button>
        </div>
      </div>
      
      {/* Show error messages at the top if any exist */}
      {errorMessages.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium mb-1 text-red-400">Errors ({errorMessages.length}):</h4>
          <ScrollArea className="h-[120px] rounded-md border border-red-900/30 bg-red-950/20 p-2">
            <div className="space-y-1">
              {errorMessages.map((message, index) => renderMessage(message, index, 'error'))}
            </div>
          </ScrollArea>
        </div>
      )}
      
      {/* Show verification messages if any exist */}
      {verificationMessages.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium mb-1 text-cyan-400 flex items-center">
            <Database className="h-3.5 w-3.5 mr-1" /> Data Verification ({verificationMessages.length}):
          </h4>
          <ScrollArea className="h-[120px] rounded-md border border-cyan-900/30 bg-cyan-950/20 p-2">
            <div className="space-y-1">
              {verificationMessages.map((message, index) => renderMessage(message, index, 'verification'))}
            </div>
          </ScrollArea>
        </div>
      )}
      
      {/* Show customer data messages if any exist */}
      {customerDataMessages.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium mb-1 text-cyan-400">Customer Data ({customerDataMessages.length}):</h4>
          <ScrollArea className="h-[120px] rounded-md border border-cyan-900/30 bg-cyan-950/20 p-2">
            <div className="space-y-1">
              {customerDataMessages.map((message, index) => renderMessage(message, index, 'customer'))}
            </div>
          </ScrollArea>
        </div>
      )}
      
      {/* Show database messages if any exist */}
      {databaseMessages.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium mb-1 text-blue-400">Database Operations ({databaseMessages.length}):</h4>
          <ScrollArea className="h-[120px] rounded-md border border-blue-900/30 bg-blue-950/20 p-2">
            <div className="space-y-1">
              {databaseMessages.map((message, index) => renderMessage(message, index, 'database'))}
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
      
      {/* Show raw logs if toggled */}
      {showRaw && (
        <div className="mt-4">
          <h4 className="text-xs font-medium mb-1 text-zinc-300">Raw Logs ({debugInfo.length}):</h4>
          <ScrollArea className="h-[300px] rounded-md border border-zinc-700/50 bg-zinc-900/50 p-2 font-mono">
            <pre className="text-xs text-zinc-400 whitespace-pre-wrap">
              {debugInfo.join('\n')}
            </pre>
          </ScrollArea>
        </div>
      )}
      
      {/* Show filtered logs if not showing raw */}
      {!showRaw && (
        <div>
          <h4 className="text-xs font-medium mb-1 text-zinc-300">All Logs ({debugInfo.length}):</h4>
          <ScrollArea className="h-[200px] rounded-md border border-zinc-700/50 bg-zinc-900/50 p-2">
            <div className="space-y-1">
              {debugInfo.map((message, index) => renderMessage(message, index, 'all'))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default DebugInfoPanel;
