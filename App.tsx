import React, { useState, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { FileExplorer } from './components/FileExplorer';
import { EditorPanel } from './components/EditorPanel';
import { LogPanel } from './components/LogPanel';
import type { LogEntry, ViewType, FileItem, DerivationTask } from './types';
import { generateRCode } from './services/geminiService';

const App: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [derivationTasks, setDerivationTasks] = useState<DerivationTask[]>([]);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [activeView, setActiveView] = useState<ViewType>('spec');
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = useCallback((message: string, type: 'info' | 'success' | 'error' | 'system' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  }, []);
  
  const createSinglePrompt = (variable: { variable: string; derivation: string; }): string => {
    return `Derive the variable "${variable.variable}" using the following logic: ${variable.derivation}. The new column should be added to the data frame.`;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.name.endsWith('.xlsx')) {
        addLog(`Specification file processed: ${file.name}`, 'success');
        
        // Mock parsing of XLSX file into rows
        const mockSpecRows = [
            { id: 1, variable: "AESER", type: "char", label: "Serious Event", derivation: "If AESEV is 'SEVERE' then 'Y' else 'N'" },
            { id: 2, variable: "ADURN", type: "num", label: "Analysis Duration (days)", derivation: "Calculate as (AEENDTC - AESTDTC) + 1" },
            { id: 3, variable: "AGEGR1", type: "char", label: "Age Group 1", derivation: "Categorize AGE into groups: '<18', '18-64', '>=65'" }
        ];
  
        const tasks: DerivationTask[] = mockSpecRows.map(row => ({
            ...row,
            prompt: createSinglePrompt(row),
            isApproved: false,
        }));
  
        setDerivationTasks(tasks);
        setActiveView('spec');
        setAiPrompt(''); // Clear old combined prompt
        setGeneratedCode(''); // Clear old code
        addLog(`${tasks.length} derivation tasks created from spec. Review and approve them to proceed.`, 'system');

      } else {
        addLog('Invalid file type. Please upload a .xlsx file.', 'error');
      }
    }
  };
  
  const handlePromptChange = (id: number, newPrompt: string) => {
    setDerivationTasks(tasks => tasks.map(task => 
      task.id === id ? { ...task, prompt: newPrompt } : task
    ));
  };

  const handleApproveToggle = (id: number) => {
    setDerivationTasks(tasks => {
        const newTasks = tasks.map(task => 
          task.id === id ? { ...task, isApproved: !task.isApproved } : task
        );
        const changedTask = newTasks.find(t => t.id === id);
        if (changedTask) {
            addLog(`Task for '${changedTask.variable}' ${changedTask.isApproved ? 'approved' : 'unapproved'}.`, 'info');
        }
        return newTasks;
    });
  };

  const createFinalPrompt = (tasks: DerivationTask[]): string => {
    const approvedPrompts = tasks
      .filter(task => task.isApproved)
      .map((task, index) => `${index + 1}. ${task.prompt}`)
      .join('\n');

    if (!approvedPrompts) return '';

    return `
You are an expert R programmer specializing in clinical trial data analysis and CDISC standards for SDTM and ADAM datasets.

Your task is to generate a single R script that performs a series of derivations to create an ADAM dataset.

Base Data:
First, create a sample R data frame that serves as a realistic input. It should be a tibble named 'source_data' and must contain the following columns with at least 10 rows of data:
- USUBJID (character, e.g., 'SUBJ-001')
- AESEV (character, one of 'MILD', 'MODERATE', 'SEVERE')
- AESTDTC (character, ISO 8601 date, e.g., '2023-01-10')
- AEENDTC (character, ISO 8601 date, e.g., '2023-01-15')
- AGE (numeric, e.g., 25)

Derivations:
Using the 'source_data' frame, perform the following derivations sequentially. Use 'tidyverse' (dplyr) syntax, preferably within a single pipe chain.

${approvedPrompts}

Final Output:
The final transformed data frame should be assigned to a variable named 'ADAE'.
Ensure the code is clean, well-commented, and ready to execute.
Finally, print the head of the 'ADAE' dataframe to verify the output.
`;
  };

  const handleGenerate = async () => {
    const approvedTasks = derivationTasks.filter(task => task.isApproved);
    if (approvedTasks.length === 0) {
      addLog('Please approve at least one derivation task before generating code.', 'error');
      return;
    }
    
    const finalPrompt = createFinalPrompt(derivationTasks);
    setAiPrompt(finalPrompt);
    setActiveView('prompt');
    addLog('Combined prompt created for approved tasks. Sending to Gemini.', 'system');

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const code = await generateRCode(finalPrompt);
      setGeneratedCode(code);
      addLog('R code generated successfully.', 'success');
      setActiveView('code');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`Code generation failed: ${errorMessage}`, 'error');
      setActiveView('prompt'); // Revert to prompt view on failure
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecute = () => {
    if (!generatedCode) {
      addLog('No code to execute. Please generate code first.', 'error');
      return;
    }
    setIsExecuting(true);
    addLog('Simulating R code execution...', 'system');
    
    const executionSteps = [
      { msg: "Starting R environment...", delay: 500 },
      { msg: "Loading 'tidyverse' library...", delay: 1000 },
      { msg: "Creating source data frame...", delay: 800 },
      { msg: "Applying derivation logic...", delay: 1200 },
      { msg: "Finalizing ADAE dataset structure...", delay: 700 },
      { msg: "Execution successful. Dataset created.", type: 'success', delay: 500 },
    ];

    let cumulativeDelay = 0;
    executionSteps.forEach(step => {
      cumulativeDelay += step.delay;
      setTimeout(() => {
        addLog(step.msg, (step.type || 'info') as any);
        if (step.msg.includes('Execution successful')) {
          setIsExecuting(false);
        }
      }, cumulativeDelay);
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const files: FileItem[] = [
    { name: 'spec_tasks.md', type: 'spec', available: derivationTasks.length > 0 },
    { name: 'final_prompt.txt', type: 'prompt', available: !!aiPrompt },
    { name: 'generate_code.R', type: 'code', available: !!generatedCode }
  ];

  const isGenerateEnabled = derivationTasks.length > 0 && derivationTasks.some(task => task.isApproved);
  const isExecuteEnabled = !!generatedCode;

  return (
    <div className="flex flex-col h-screen bg-slate-900 font-sans">
      <Header
        onUploadClick={handleUploadClick}
        onGenerate={handleGenerate}
        onExecute={handleExecute}
        isGenerating={isLoading}
        isExecuting={isExecuting}
        generateEnabled={isGenerateEnabled}
        executeEnabled={isExecuteEnabled}
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      />
      <main className="flex flex-1 overflow-hidden">
        <FileExplorer files={files} activeView={activeView} onSelectView={setActiveView} />
        <div className="flex flex-col flex-1 w-full overflow-hidden">
          <EditorPanel
            activeView={activeView}
            derivationTasks={derivationTasks}
            onPromptChange={handlePromptChange}
            onApproveToggle={handleApproveToggle}
            aiPrompt={aiPrompt}
            generatedCode={generatedCode}
            setGeneratedCode={setGeneratedCode}
            isLoading={isLoading}
          />
          <LogPanel logs={logs} />
        </div>
      </main>
    </div>
  );
};

export default App;
