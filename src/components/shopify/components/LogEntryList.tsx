
import React from 'react';

interface LogEntryListProps {
  entries: string[];
}

const LogEntryList: React.FC<LogEntryListProps> = ({ entries }) => {
  return (
    <div className="font-mono text-xs">
      {entries.map((entry, index) => (
        <div key={index} className="py-1 border-b border-zinc-800/50 last:border-0 whitespace-pre-wrap">
          {entry}
        </div>
      ))}
      {entries.length === 0 && (
        <div className="text-zinc-500 italic">No logs available</div>
      )}
    </div>
  );
};

export default LogEntryList;
