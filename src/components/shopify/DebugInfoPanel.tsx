
import React from 'react';

interface DebugInfoPanelProps {
  debugInfo: string[];
}

const DebugInfoPanel: React.FC<DebugInfoPanelProps> = ({ debugInfo }) => {
  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded p-2 h-64 overflow-y-auto text-xs font-mono">
      {debugInfo.map((message, index) => (
        <div key={index} className="py-0.5 border-b border-zinc-800/50 last:border-0">
          {message}
        </div>
      ))}
      {debugInfo.length === 0 && (
        <div className="text-zinc-500 italic">No logs available</div>
      )}
    </div>
  );
};

export default DebugInfoPanel;
