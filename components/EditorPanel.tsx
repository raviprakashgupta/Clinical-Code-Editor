import React from 'react';
import type { ViewType, DerivationTask, ExecutionError, ConvertedCode, SupportedLanguage } from '../types';
import { CheckCircleIcon, CircleIcon, LightBulbIcon, DownloadIcon, CogIcon, PlayIcon, TranslateIcon, SaveIcon, PythonIcon, CodeIcon as RIcon } from './Icons';
import { DataTable } from './DataTable';

interface EditorPanelProps {
  activeView: ViewType;
  derivationTasks: DerivationTask[];
  onPromptChange: (id: number, newPrompt: string) => void;
  onApproveToggle: (id: number) => void;
  aiPrompt: string;
  generatedCode: string;
  setGeneratedCode: (code: string) => void;
  driverCode: string;
  setDriverCode: (code: string) => void;
  isLoading: boolean;
  executionError: ExecutionError | null;
  onDebug: () => void;
  isDebugging: boolean;
  onDownloadTemplate: () => void;
  outputData: any[] | null;
  convertedCode: ConvertedCode | null;

  onGenerate: () => void;
  isGenerating: boolean;
  generateEnabled: boolean;

  onExecute: (lang: SupportedLanguage) => void;
  isExecuting: boolean;
  executeEnabled: boolean;

  onConvert: (lang: SupportedLanguage) => void;
  isConverting: boolean;
  convertEnabled: boolean;

  onSaveAs: () => void;
  saveEnabled: boolean;
}

const EditorPlaceholder: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-4 animate-fade-in">
    <h3 className="text-lg font-semibold text-slate-600 mb-2">{title}</h3>
    {children}
  </div>
);

const ExecuteDropdown: React.FC<{ onExecute: (lang: SupportedLanguage) => void, isExecuting: boolean, executeEnabled: boolean }> = ({ onExecute, isExecuting, executeEnabled }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    
    const handleSelect = (lang: SupportedLanguage) => {
        onExecute(lang);
        setIsOpen(false);
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isExecuting || !executeEnabled}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-400"
            >
                {isExecuting ? <div className="w-5 h-5 border-2 border-transparent border-t-white rounded-full animate-spin"></div> : <PlayIcon className="w-5 h-5" />}
                <span>{isExecuting ? 'Executing...' : 'Execute'}</span>
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-slate-700 border border-slate-600 rounded-md shadow-lg z-10">
                    <button onClick={() => handleSelect('R')} className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600 flex items-center space-x-2">
                      <RIcon className="w-4 h-4 text-purple-400" /> <span>Execute R</span>
                    </button>
                    <button onClick={() => handleSelect('Python')} className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600 flex items-center space-x-2">
                      <PythonIcon className="w-4 h-4 text-green-400" /> <span>Execute Python</span>
                    </button>
                </div>
            )}
        </div>
    )
}

const ConvertDropdown: React.FC<{ onConvert: (lang: SupportedLanguage) => void, isConverting: boolean, convertEnabled: boolean }> = ({ onConvert, isConverting, convertEnabled }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    
    const handleSelect = (lang: SupportedLanguage) => {
        onConvert(lang);
        setIsOpen(false);
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isConverting || !convertEnabled}
                className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
                {isConverting ? <div className="w-5 h-5 border-2 border-transparent border-t-white rounded-full animate-spin"></div> : <TranslateIcon className="w-5 h-5" />}
                <span>{isConverting ? 'Converting...' : 'Convert'}</span>
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-slate-700 border border-slate-600 rounded-md shadow-lg z-10">
                    <button onClick={() => handleSelect('Python')} className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600">to Python</button>
                    <button onClick={() => handleSelect('SAS')} className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600">to SAS</button>
                </div>
            )}
        </div>
    )
}

const ActionBar: React.FC<Pick<EditorPanelProps, 'onGenerate'|'isGenerating'|'generateEnabled'|'onExecute'|'isExecuting'|'executeEnabled'|'onConvert'|'isConverting'|'convertEnabled' | 'onSaveAs' | 'saveEnabled'>> = (props) => (
    <div className="bg-slate-200 p-2 border-b border-slate-300 flex-shrink-0 flex items-center justify-end space-x-3">
        <button
          onClick={props.onSaveAs}
          disabled={!props.saveEnabled}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <SaveIcon className="w-5 h-5" />
          <span>Save As...</span>
        </button>
        <button
          onClick={props.onGenerate}
          disabled={props.isGenerating || !props.generateEnabled}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {props.isGenerating ? <CogIcon className="w-5 h-5 animate-spin" /> : <CogIcon className="w-5 h-5" />}
          <span>{props.isGenerating ? 'Generating...' : 'Generate'}</span>
        </button>
        <ExecuteDropdown onExecute={props.onExecute} isExecuting={props.isExecuting} executeEnabled={props.executeEnabled} />
        <ConvertDropdown onConvert={props.onConvert} isConverting={props.isConverting} convertEnabled={props.convertEnabled} />
    </div>
);

const DerivationTaskItem: React.FC<{
  task: DerivationTask;
  onPromptChange: (id: number, newPrompt: string) => void;
  onApproveToggle: (id: number) => void;
}> = ({ task, onPromptChange, onApproveToggle }) => {
  return (
    <div className="bg-white border border-slate-300 rounded-lg p-4 mb-4 animate-fade-in shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-md text-blue-600">{task.variable} <span className="text-sm text-slate-500 font-normal">- {task.label}</span></h4>
          <p className="text-sm text-slate-700 mt-1"><span className="font-semibold">Derivation Logic:</span> {task.derivation}</p>
        </div>
        <button
          onClick={() => onApproveToggle(task.id)}
          className="flex items-center space-x-2 text-sm px-3 py-1 rounded-full transition-colors duration-200 hover:bg-slate-200"
          title={task.isApproved ? 'Un-approve this task' : 'Approve this task'}
        >
          {task.isApproved 
            ? <CheckCircleIcon className="w-6 h-6 text-green-500" />
            : <CircleIcon className="w-6 h-6 text-slate-400 hover:text-slate-600" />
          }
          <span className={`font-semibold ${task.isApproved ? 'text-green-600' : 'text-slate-500'}`}>
            {task.isApproved ? 'Approved' : 'Approve'}
          </span>
        </button>
      </div>
      <div className="mt-4">
        <label htmlFor={`prompt-${task.id}`} className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Editable AI Prompt</label>
        <textarea
          id={`prompt-${task.id}`}
          value={task.prompt}
          onChange={(e) => onPromptChange(task.id, e.target.value)}
          className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md font-mono text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
          rows={3}
          spellCheck="false"
        />
      </div>
    </div>
  );
};

const ErrorOverlay: React.FC<{ error: ExecutionError; onDebug: () => void; isDebugging: boolean; }> = ({ error, onDebug, isDebugging }) => (
    <div className="absolute bottom-4 right-4 bg-red-800/80 backdrop-blur-sm border border-red-500 p-4 rounded-lg shadow-2xl max-w-md z-10 animate-fade-in text-white">
      <h4 className="font-bold text-red-200 mb-2">Execution Failed</h4>
      {error.line && <p className="text-xs text-red-200 font-mono mb-2">Potential issue near line: {error.line}</p>}
      <pre className="text-xs whitespace-pre-wrap font-mono my-2 bg-black/20 p-2 rounded-md">{error.message}</pre>
      <button 
        onClick={onDebug} 
        disabled={isDebugging}
        className="mt-2 w-full flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-500 text-slate-900 font-semibold rounded-md hover:bg-yellow-400 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-300"
      >
        {isDebugging ? <div className="w-5 h-5 border-2 border-transparent border-t-slate-900 rounded-full animate-spin"></div> : <LightBulbIcon className="w-5 h-5" />}
        <span>{isDebugging ? 'Debugging...' : 'Debug with AI'}</span>
      </button>
    </div>
);

const CodeEditorStyles = "w-full h-full p-4 bg-white text-slate-800 font-mono text-sm focus:outline-none resize-none";

export const EditorPanel: React.FC<EditorPanelProps> = (props) => {
  const { activeView, derivationTasks, onPromptChange, onApproveToggle, aiPrompt, generatedCode, setGeneratedCode, driverCode, setDriverCode, isLoading, executionError, onDebug, isDebugging, onDownloadTemplate, outputData, convertedCode } = props;

  const renderContent = () => {
    switch (activeView) {
      case 'spec':
        return derivationTasks.length > 0 ? (
          <div className="p-4 bg-slate-100">
            {derivationTasks.map(task => (
              <DerivationTaskItem key={task.id} task={task} onPromptChange={onPromptChange} onApproveToggle={onApproveToggle}/>
            ))}
          </div>
        ) : (
          <EditorPlaceholder title="Specification Derivations">
            <p className="mb-4">Upload a .xlsx specification file or download our template to get started.</p>
            <button
              onClick={onDownloadTemplate}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <DownloadIcon className="w-5 h-5" />
              <span>Download ADAE Spec Template</span>
            </button>
          </EditorPlaceholder>
        );
      case 'prompt':
        return aiPrompt ? (
          <pre className={`${CodeEditorStyles} whitespace-pre-wrap`}>{aiPrompt}</pre>
        ) : (
          <EditorPlaceholder title="Combined AI Prompt"><p>Approve tasks and click 'Generate' to create the final prompt.</p></EditorPlaceholder>
        );
      case 'driver':
         return <textarea value={driverCode} onChange={(e) => setDriverCode(e.target.value)} className={CodeEditorStyles} spellCheck="false" />;
      case 'code':
        if (isLoading) {
          return (
             <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-4">
                <div className="w-8 h-8 border-4 border-transparent border-t-blue-500 rounded-full animate-spin mb-4"></div>
                <h3 className="text-lg font-semibold text-slate-600">Generating Code...</h3>
                <p>The AI is crafting your R script. Please wait.</p>
            </div>
          )
        }
        return generatedCode ? (
          <div className="relative w-full h-full">
            <textarea value={generatedCode} onChange={(e) => setGeneratedCode(e.target.value)} className={CodeEditorStyles} spellCheck="false" />
            {executionError && <ErrorOverlay error={executionError} onDebug={onDebug} isDebugging={isDebugging} />}
          </div>
        ) : (<EditorPlaceholder title="Generated R Code"><p>Generate code from the AI prompt to see it here.</p></EditorPlaceholder>);
      case 'output':
        return outputData ? <DataTable data={outputData} /> : <EditorPlaceholder title="Output Viewer"><p>Execute the code to see the generated dataset here.</p></EditorPlaceholder>;
      case 'converted':
        return convertedCode ? (
             <textarea value={convertedCode.code} readOnly className={CodeEditorStyles} spellCheck="false" />
        ) : <EditorPlaceholder title="Converted Code"><p>Convert the generated R code to another language to see it here.</p></EditorPlaceholder>;
      default:
        return null;
    }
  };
  
  const getTitle = () => {
      switch (activeView) {
          case 'spec': return 'Specification Tasks';
          case 'prompt': return 'Final Combined AI Prompt';
          case 'driver': return 'Driver Script (driver.R)';
          case 'code': return 'Generated Function (generate_code.R)';
          case 'output': return 'Output Viewer (output_adae.csv)';
          case 'converted': return convertedCode ? `Converted Code (${convertedCode.language})` : 'Converted Code';
          default: return 'Editor';
      }
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-100 border-b border-slate-300 overflow-hidden">
        <ActionBar
            onGenerate={props.onGenerate} isGenerating={props.isGenerating} generateEnabled={props.generateEnabled}
            onExecute={props.onExecute} isExecuting={props.isExecuting} executeEnabled={props.executeEnabled}
            onConvert={props.onConvert} isConverting={props.isConverting} convertEnabled={props.convertEnabled}
            onSaveAs={props.onSaveAs} saveEnabled={props.saveEnabled}
        />
      <div className="bg-slate-200 p-2 border-b border-slate-300 flex-shrink-0">
          <h2 className="text-sm font-medium text-slate-600">{getTitle()}</h2>
      </div>
      <div className="flex-1 overflow-auto bg-white">
          {renderContent()}
      </div>
    </div>
  );
};