import React from 'react';
import { UploadIcon, DownloadIcon } from './Icons';

interface HeaderProps {
  onUploadClick: () => void;
  onDownloadTemplate: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onUploadClick, 
  onDownloadTemplate,
}) => {
  return (
    <header className="flex items-center justify-between p-3 bg-slate-800 border-b border-slate-700 shadow-md flex-shrink-0">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
          <span className="font-bold text-slate-900 text-lg">P</span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-wider">
          Programming Assistant <span className="text-cyan-400">Tool</span>
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={onDownloadTemplate}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          title="Download ADAE spec template file"
        >
          <DownloadIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Download Template</span>
        </button>
        <button
          onClick={onUploadClick}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          title="Upload an XLSX specification file"
        >
          <UploadIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Upload Spec</span>
        </button>
      </div>
    </header>
  );
};