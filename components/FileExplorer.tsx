import React from 'react';
import type { FileItem, ViewType } from '../types';
import { FileIcon, CodeIcon, DocumentTextIcon, TableIcon, PythonIcon, SASIcon } from './Icons';

interface FileExplorerProps {
  files: FileItem[];
  activeView: ViewType;
  onSelectView: (view: ViewType) => void;
}

const getIcon = (file: FileItem) => {
    if (file.type === 'code' || file.type === 'driver' || file.type === 'converted') {
        switch(file.language) {
            case 'Python': return <PythonIcon className="w-5 h-5 text-green-400" />;
            case 'SAS': return <SASIcon className="w-5 h-5 text-blue-400" />;
            case 'R': return <CodeIcon className="w-5 h-5 text-purple-400" />;
            default: return <CodeIcon className="w-5 h-5 text-cyan-400" />;
        }
    }
    switch (file.type) {
        case 'spec':
            return <FileIcon className="w-5 h-5 text-emerald-400" />;
        case 'prompt':
            return <DocumentTextIcon className="w-5 h-5 text-yellow-400" />;
        case 'output':
            return <TableIcon className="w-5 h-5 text-orange-400" />;
        default:
            return <FileIcon className="w-5 h-5 text-slate-400" />;
    }
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ files, activeView, onSelectView }) => {
  return (
    <aside className="w-64 bg-slate-800/50 border-r border-slate-700 p-4 flex-shrink-0 hidden md:block">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Explorer</h2>
      <ul>
        {files.map((file) => (
          <li key={file.name}>
            <button
              onClick={() => onSelectView(file.type)}
              disabled={!file.available}
              className={`w-full flex items-center space-x-3 p-2 rounded-md text-left transition-colors duration-200 ${
                activeView === file.type ? 'bg-slate-700 text-white' : 'text-slate-300'
              } ${
                file.available ? 'hover:bg-slate-700/50 cursor-pointer' : 'opacity-50 cursor-not-allowed'
              }`}
            >
              {getIcon(file)}
              <span>{file.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
};
