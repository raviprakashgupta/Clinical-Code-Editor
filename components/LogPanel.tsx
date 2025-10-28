import React, { useEffect, useRef } from 'react';
import type { LogEntry } from '../types';
import { DownloadIcon } from './Icons';

interface LogPanelProps {
  logs: LogEntry[];
  onDownload: () => void;
}

export const LogPanel: React.FC<LogPanelProps> = ({ logs, onDownload }) => {
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
    <div className="h-48 md:h-64 flex flex-col bg-slate-800/50 flex-shrink-0 dark">
       <div className="bg-slate-800 p-2 border-b border-t border-slate-700 flex-shrink-0 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-300">Logs</h2>
          <button onClick={onDownload} title="Download logs" className="p-1 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <DownloadIcon className="w-4 h-4" />
          </button>
      </div>
      <div ref={scrollRef} className="flex-1 p-3 overflow-y-auto font-mono text-xs bg-slate-900">
        {logs.length === 0 ? (
            <div className="text-slate-500 text-center pt-8">Log panel is ready. Start by uploading a spec.</div>
        ) : (
            logs.map((log, index) => (
                <div key={index} className="flex">
                    <span className="text-slate-500 mr-3">{log.timestamp}</span>
                    <span className={`whitespace-pre-wrap ${getLogColor(log.type)}`}>{log.message}</span>
                </div>
            ))
        )}
      </div>
    </div>
  );
};