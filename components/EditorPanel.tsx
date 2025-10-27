import React from 'react';
import type { ViewType, DerivationTask } from '../types';
import { CheckCircleIcon, CircleIcon } from './Icons';

interface EditorPanelProps {
  activeView: ViewType;
  derivationTasks: DerivationTask[];
  onPromptChange: (id: number, newPrompt: string) => void;
  onApproveToggle: (id: number) => void;
  aiPrompt: string;
  generatedCode: string;
  setGeneratedCode: (code: string) => void;
  isLoading: boolean;
}

const EditorPlaceholder: React.FC<{ title: string; message: string }> = ({ title, message }) => (
  <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-4">
    <h3 className="text-lg font-semibold text-slate-400 mb-2">{title}</h3>
    <p>{message}</p>
  </div>
);

const DerivationTaskItem: React.FC<{
  task: DerivationTask;
  onPromptChange: (id: number, newPrompt: string) => void;
  onApproveToggle: (id: number) => void;
}> = ({ task, onPromptChange, onApproveToggle }) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-md text-cyan-400">{task.variable} <span className="text-sm text-slate-400 font-normal">- {task.label}</span></h4>
          <p className="text-sm text-slate-300 mt-1"><span className="font-semibold">Derivation Logic:</span> {task.derivation}</p>
        </div>
        <button
          onClick={() => onApproveToggle(task.id)}
          className="flex items-center space-x-2 text-sm px-3 py-1 rounded-full transition-colors duration-200 hover:bg-slate-700"
          title={task.isApproved ? 'Un-approve this task' : 'Approve this task'}
        >
          {task.isApproved 
            ? <CheckCircleIcon className="w-6 h-6 text-green-400" />
            : <CircleIcon className="w-6 h-6 text-slate-500 hover:text-slate-300" />
          }
          <span className={`font-semibold ${task.isApproved ? 'text-green-400' : 'text-slate-400'}`}>
            {task.isApproved ? 'Approved' : 'Approve'}
          </span>
        </button>
      </div>
      <div className="mt-4">
        <label htmlFor={`prompt-${task.id}`} className="block text-xs font-semibold text-slate-400 mb-1">EDITABLE AI PROMPT</label>
        <textarea
          id={`prompt-${task.id}`}
          value={task.prompt}
          onChange={(e) => onPromptChange(task.id, e.target.value)}
          className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md font-mono text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-y"
          rows={3}
          spellCheck="false"
        />
      </div>
    </div>
  );
};


export const EditorPanel: React.FC<EditorPanelProps> = ({ activeView, derivationTasks, onPromptChange, onApproveToggle, aiPrompt, generatedCode, setGeneratedCode, isLoading }) => {
  const renderContent = () => {
    switch (activeView) {
      case 'spec':
        return derivationTasks.length > 0 ? (
          <div className="p-4">
            {derivationTasks.map(task => (
              <DerivationTaskItem 
                key={task.id} 
                task={task} 
                onPromptChange={onPromptChange}
                onApproveToggle={onApproveToggle}
              />
            ))}
          </div>
        ) : (
          <EditorPlaceholder title="Specification Derivations" message="Upload a .xlsx specification file to see derivation tasks here." />
        );
      case 'prompt':
        return aiPrompt ? (
          <pre className="p-4 text-sm whitespace-pre-wrap font-mono">{aiPrompt}</pre>
        ) : (
          <EditorPlaceholder title="Combined AI Prompt" message="Approve tasks and click 'Generate Code' to create the final prompt." />
        );
      case 'code':
        if (isLoading) {
          return (
             <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-4">
                <div className="w-8 h-8 border-4 border-transparent border-t-cyan-400 rounded-full animate-spin mb-4"></div>
                <h3 className="text-lg font-semibold">Generating Code...</h3>
                <p className="text-slate-500">The AI is crafting your R script. Please wait.</p>
            </div>
          )
        }
        return generatedCode ? (
          <textarea
            value={generatedCode}
            onChange={(e) => setGeneratedCode(e.target.value)}
            className="w-full h-full p-4 bg-transparent font-mono text-sm text-slate-200 focus:outline-none resize-none"
            spellCheck="false"
          />
        ) : (
            <EditorPlaceholder title="R Code Editor" message="Generate code from the AI prompt to see it here." />
        );
      default:
        return null;
    }
  };
  
  const getTitle = () => {
      switch (activeView) {
          case 'spec': return 'Specification Tasks';
          case 'prompt': return 'Final Combined AI Prompt';
          case 'code': return 'Generated Code (R)';
          default: return 'Editor';
      }
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-900 border-b border-slate-700 overflow-hidden">
      <div className="bg-slate-800 p-2 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-sm font-medium text-slate-300">{getTitle()}</h2>
      </div>
      <div className="flex-1 overflow-auto bg-[#0d1117]">
          {renderContent()}
      </div>
    </div>
  );
};
