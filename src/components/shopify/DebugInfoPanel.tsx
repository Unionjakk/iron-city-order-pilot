
import React from 'react';

interface DebugInfoPanelProps {
  debugInfo: string[];
}

const DebugInfoPanel: React.FC<DebugInfoPanelProps> = ({ debugInfo }) => {
  if (debugInfo.length === 0) return null;
  
  return (
    <div className="mt-4 border border-zinc-800 rounded-md p-2 bg-zinc-950/50">
      <h4 className="text-orange-500 text-sm font-medium mb-2">Debug Information</h4>
      <div className="max-h-60 overflow-y-auto text-xs font-mono">
        {debugInfo.map((message, index) => (
          <div key={index} className="py-1 border-b border-zinc-800 last:border-0">
            <span className="text-zinc-500">[{new Date().toISOString().substring(11, 19)}]</span>{' '}
            <span className="text-zinc-300">{message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebugInfoPanel;
