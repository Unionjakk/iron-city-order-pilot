
import { ScrollArea } from "@/components/ui/scroll-area";

interface DebugInfoPanelProps {
  debugInfo: string[];
}

const DebugInfoPanel = ({ debugInfo }: DebugInfoPanelProps) => {
  // Filter for error messages to highlight them
  const errorMessages = debugInfo.filter(msg => 
    msg.includes("ERROR") || 
    msg.includes("error") || 
    msg.includes("failed") || 
    msg.includes("Failed")
  );
  
  // Show the most recent messages first (they're already in reverse chronological order)
  return (
    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-md p-4">
      <h3 className="text-sm font-medium mb-2 text-zinc-300">Debug Information</h3>
      
      {/* Show error messages at the top if any exist */}
      {errorMessages.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium mb-1 text-red-400">Errors:</h4>
          <ScrollArea className="h-[100px] rounded-md border border-red-900/30 bg-red-950/20 p-2">
            <div className="space-y-1">
              {errorMessages.map((message, index) => (
                <p key={`error-${index}`} className="text-xs text-red-400 font-mono whitespace-pre-wrap">
                  {message}
                </p>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
      
      {/* Show all messages */}
      <ScrollArea className="h-[200px] rounded-md border border-zinc-700/50 bg-zinc-900/50 p-2">
        <div className="space-y-1">
          {debugInfo.map((message, index) => (
            <p 
              key={`msg-${index}`} 
              className={`text-xs font-mono whitespace-pre-wrap ${
                message.includes("ERROR") || message.includes("error") || message.includes("failed") || message.includes("Failed")
                  ? "text-red-400" 
                  : message.includes("SUCCESS") || message.includes("success") || message.includes("completed successfully")
                    ? "text-green-400"
                    : message.includes("WARNING") || message.includes("warning")
                      ? "text-yellow-400"
                      : "text-zinc-400"
              }`}
            >
              {message}
            </p>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DebugInfoPanel;
