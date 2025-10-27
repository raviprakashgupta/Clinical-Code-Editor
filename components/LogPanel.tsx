import React, { useEffect, useRef } from 'react';
import type { LogEntry } from '../types';

interface LogPanelProps {
  logs: LogEntry[];
}

export const LogPanel: React.FC<LogPanelProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'system':
        return 'text-cyan-400';
      case 'info':
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="h-48 md:h-64 flex flex-col bg-slate-800/50 flex-shrink-0">
       <div className="bg-slate-800 p-2 border-b border-t border-slate-700 flex-shrink-0">
          <h2 className="text-sm font-medium text-slate-300">Logs</h2>
      </div>
      <div ref={scrollRef} className="flex-1 p-3 overflow-y-auto font-mono text-xs">
        {logs.map((log, index) => (
          <div key={index} className="flex">
            <span className="text-slate-500 mr-3">{log.timestamp}</span>
            <span className={getLogColor(log.type)}>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
