import React from 'react';
import { UploadIcon, CogIcon, PlayIcon } from './Icons';

interface HeaderProps {
  onUploadClick: () => void;
  onGenerate: () => void;
  onExecute: () => void;
  isGenerating: boolean;
  isExecuting: boolean;
  generateEnabled: boolean;
  executeEnabled: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onUploadClick, onGenerate, onExecute, isGenerating, isExecuting, generateEnabled, executeEnabled }) => {
  return (
    <header className="flex items-center justify-between p-3 bg-slate-800 border-b border-slate-700 shadow-md flex-shrink-0">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
          <span className="font-bold text-slate-900 text-lg">C</span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-wider">
          Clinical Code <span className="text-cyan-400">Vibe</span>
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={onUploadClick}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        >
          <UploadIcon className="w-5 h-5" />
          <span>Upload Spec</span>
        </button>
        <button
          onClick={onGenerate}
          disabled={isGenerating || !generateEnabled}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {isGenerating ? (
            <CogIcon className="w-5 h-5 animate-spin" />
          ) : (
            <CogIcon className="w-5 h-5" />
          )}
          <span>{isGenerating ? 'Generating...' : 'Generate Code'}</span>
        </button>
        <button
          onClick={onExecute}
          disabled={isExecuting || !executeEnabled}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-400"
        >
           {isExecuting ? (
            <div className="w-5 h-5 border-2 border-transparent border-t-white rounded-full animate-spin"></div>
          ) : (
             <PlayIcon className="w-5 h-5" />
          )}
          <span>{isExecuting ? 'Executing...' : 'Execute'}</span>
        </button>
      </div>
    </header>
  );
};
