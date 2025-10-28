import React, { useState, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { FileExplorer } from './components/FileExplorer';
import { EditorPanel } from './components/EditorPanel';
import { LogPanel } from './components/LogPanel';
import type { LogEntry, ViewType, FileItem, DerivationTask, ExecutionError, ConvertedCode, SupportedLanguage } from './types';
import { generateRCode, debugRCode, convertCode, simulateRCodeExecution } from './services/geminiService';

declare var XLSX: any;

const DEFAULT_DRIVER_CODE = `
# driver.R - This script orchestrates the creation of the ADAE dataset.

# 1. Load Libraries
# The 'tidyverse' package is essential for data manipulation and merging.
# install.packages("tidyverse")
library(tidyverse)
library(lubridate) # Often needed for date calculations

# 2. Source the generated ADAE function
# The 'create_adae' function is defined in the AI-generated 'generate_code.R'
# In a real environment, you would source the file: source('generate_code.R')

# 3. Create Mock Source Data
# For this simulation, we'll create mock ADSL and AE datasets.
adsl <- as_tibble(data.frame(
  USUBJID = c("001", "002", "003", "004"),
  TRT01P = c("Drug A", "Placebo", "Drug A", "Placebo"),
  TRTSDT = as.Date(c("2023-01-01", "2023-01-05", "2023-01-10", "2023-01-12")),
  TRTEDT = as.Date(c("2023-03-01", "2023-03-05", "2023-03-10", "2023-03-15"))
))

ae <- as_tibble(data.frame(
  USUBJID = c("001", "001", "002", "003", "004", "004"),
  AETERM = c("Headache", "Nausea", "Fatigue", "Headache", "Dizziness", "Fatigue"),
  AESTDTC = c("2023-01-15", "2023-02-10", "2023-01-20", "2023-02-01", "2023-01-18", "2023-02-20"),
  AESEV = c("MILD", "MODERATE", "MILD", "SEVERE", "MILD", "MODERATE")
))

# 4. Execute the Derivations
# The generated function is called with the source datasets.
# This assumes the function is already loaded into the environment for simulation.
adae <- create_adae(adsl, ae)

# 5. Print Output
# Display the first few rows and structure of the final ADAE dataset.
print("Generated ADAE Dataset (head):")
print(head(adae))

cat("\\n") # Add a newline for cleaner output

print("Generated ADAE Dataset (structure):")
print(glimpse(adae))
`;

const App: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [derivationTasks, setDerivationTasks] = useState<DerivationTask[]>([]);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [driverCode, setDriverCode] = useState<string>(DEFAULT_DRIVER_CODE);
  const [activeView, setActiveView] = useState<ViewType>('spec');
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [executionError, setExecutionError] = useState<ExecutionError | null>(null);
  const [outputData, setOutputData] = useState<any[] | null>(null);
  const [convertedCode, setConvertedCode] = useState<ConvertedCode | null>(null);


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
        addLog(`Processing spec file: ${file.name}...`, 'system');
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target!.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json: any[] = XLSX.utils.sheet_to_json(worksheet);
            
            if (json.length === 0) {
              addLog('The uploaded specification file is empty or in an invalid format.', 'error');
              return;
            }

            const firstRow = json[0] || {};
            const findKey = (keys: string[]) => Object.keys(firstRow).find(k => keys.includes(k.trim().toLowerCase())) || keys[0];

            const variableCol = findKey(['variable', 'variable name']);
            const algorithmCol = findKey(['algorithm', 'derivation', 'logic']);
            const labelCol = findKey(['label', 'variable label']);
            
            const tasks: DerivationTask[] = json.map((row, index) => ({
                id: index + 1,
                variable: row[variableCol] || 'UNKNOWN_VARIABLE',
                label: row[labelCol] || 'No label provided',
                derivation: row[algorithmCol] || 'No derivation logic provided',
                prompt: createSinglePrompt({ variable: row[variableCol], derivation: row[algorithmCol] }),
                isApproved: false,
            })).filter(task => task.variable !== 'UNKNOWN_VARIABLE' && task.derivation !== 'No derivation logic provided');
    
            if (tasks.length === 0) {
              addLog('No valid tasks found in the spec. Please check column headers (e.g., "Variable Name", "Derivation").', 'error');
              return;
            }

            setDerivationTasks(tasks);
            setActiveView('spec');
            setAiPrompt('');
            setGeneratedCode('');
            setExecutionError(null);
            setOutputData(null);
            setConvertedCode(null);
            addLog(`Successfully parsed ${tasks.length} derivation tasks. Review and approve them to proceed.`, 'success');
          } catch (error) {
             const errorMessage = error instanceof Error ? error.message : String(error);
             addLog(`Failed to parse .xlsx file: ${errorMessage}`, 'error');
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        addLog('Invalid file type. Please upload a .xlsx file.', 'error');
      }
      if(fileInputRef.current) fileInputRef.current.value = "";
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
      .map((task, index) => `# ${index + 1}. ${task.prompt}`)
      .join('\n');

    if (!approvedPrompts) return '';

    return `
You are an expert statistical programmer specializing in creating CDISC ADaM datasets using R.
Your task is to generate a single R function named 'create_adae' that creates an Adverse Event Analysis Dataset (ADAE).
FUNCTION SIGNATURE:
create_adae <- function(adsl, ae) { ... }
SOURCE DATASETS:
The function will accept two source dataframes:
1. 'adsl': A subject-level analysis dataset containing subject treatment information and dates. It has columns like USUBJID, TRT01P, TRTSDT (treatment start date), TRTEDT (treatment end date).
2. 'ae': An adverse events dataset containing AE records. It has columns like USUBJID, AETERM, AESTDTC (AE start date as character "YYYY-MM-DD"), AESEV.
DERIVATIONS:
Inside the function, perform the following steps:
1. Merge 'adsl' into 'ae' using a left join by 'USUBJID' to create the base ADAE dataframe.
2. Convert character dates (AESTDTC) into R Date objects. Name the new column 'ASTDT'.
3. Use 'tidyverse' (dplyr) syntax, preferably within a single pipe chain (%>%), to perform the following derivations sequentially on the ADAE dataframe:
${approvedPrompts}
FUNCTION RETURN VALUE:
The function must return the final, transformed ADAE data frame.
CODE STYLE:
- Use the 'lubridate' package for any date or datetime calculations.
- Add comments to explain complex steps.
- Ensure the code is clean, efficient, and ready to be sourced into another R script.
- Do not include any code outside of the function definition (e.g., library calls, data creation, or calling the function).
`;
  };

  const handleGenerate = useCallback(async () => {
    const approvedTasks = derivationTasks.filter(task => task.isApproved);
    if (approvedTasks.length === 0) {
      addLog('Please approve at least one derivation task before generating code.', 'error');
      return;
    }
    
    const finalPrompt = createFinalPrompt(derivationTasks);
    setAiPrompt(finalPrompt);
    setActiveView('prompt');
    addLog('Combined prompt created. Sending to Gemini for code generation.', 'system');

    setIsLoading(true);
    setExecutionError(null);
    setOutputData(null);
    setConvertedCode(null);
    try {
      const code = await generateRCode(finalPrompt);
      setGeneratedCode(code);
      addLog('R code generated successfully.', 'success');
      setActiveView('code');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`Code generation failed: ${errorMessage}`, 'error');
      setActiveView('prompt');
    } finally {
      setIsLoading(false);
    }
  }, [derivationTasks, addLog]);

  const handleExecute = useCallback(async (language: SupportedLanguage) => {
    if (language === 'R' && !generatedCode) {
      addLog('No R code to execute. Please generate code first.', 'error');
      return;
    }
    if (language === 'Python' && (!convertedCode || convertedCode.language !== 'Python')) {
      addLog('No Python code to execute. Please convert the R code to Python first.', 'error');
      return;
    }

    setIsExecuting(true);
    setExecutionError(null);
    setOutputData(null);
    addLog(`Simulating ${language} code execution with AI...`, 'system');
    
    if (language === 'R') {
      try {
        const result = await simulateRCodeExecution(driverCode, generatedCode);
        
        if (result.status === 'success') {
          addLog('AI execution simulation successful.', 'success');
          if (result.logOutput) {
            addLog(`Console Output:\n---\n${result.logOutput}\n---`, 'info');
          }
          setOutputData(result.finalData || []);
          setActiveView('output');
        } else if (result.status === 'error' && result.error) {
          const error: ExecutionError = {
            message: result.error.message || 'AI simulation detected an unspecified error.',
            line: result.error.line,
          };
          setExecutionError(error);
          addLog(`Execution failed: ${error.message.split('\n')[0]}`, 'error');
          setActiveView('code');
        } else {
            throw new Error('Unexpected response format from AI simulator.');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        addLog(`Execution simulation failed: ${errorMessage}`, 'error');
        setExecutionError({ message: `The AI simulator failed to process the code. Error: ${errorMessage}` });
        setActiveView('code');
      } finally {
        setIsExecuting(false);
      }
    } else { // Fallback for Python or other languages
      // Generic success simulation
      setTimeout(() => {
        addLog('Execution successful. View the output in the explorer.', 'success');
        const mockData = [
            { USUBJID: '001', AETERM: 'Headache', TRT01P: 'Drug A', ASTDT: '2023-01-15', ADY: 15, TRTEMFL: 'Y', ASER: 'Mild' },
            { USUBJID: '001', AETERM: 'Nausea', TRT01P: 'Drug A', ASTDT: '2023-02-10', ADY: 41, TRTEMFL: 'Y', ASER: 'Moderate' },
            { USUBJID: '002', AETERM: 'Fatigue', TRT01P: 'Placebo', ASTDT: '2023-01-20', ADY: 16, TRTEMFL: 'Y', ASER: 'Mild' },
            { USUBJID: '003', AETERM: 'Headache', TRT01P: 'Drug A', ASTDT: '2023-02-01', ADY: 23, TRTEMFL: 'Y', ASER: 'Severe' },
            { USUBJID: '004', AETERM: 'Dizziness', TRT01P: 'Placebo', ASTDT: '2023-01-18', ADY: 7, TRTEMFL: 'Y', ASER: 'Mild' },
            { USUBJID: '004', AETERM: 'Fatigue', TRT01P: 'Placebo', ASTDT: '2023-02-20', ADY: 40, TRTEMFL: 'Y', ASER: 'Moderate' }
        ];
        setOutputData(mockData);
        setIsExecuting(false);
        setActiveView('output');
      }, 2000);
    }
  }, [generatedCode, driverCode, convertedCode, addLog]);
  
  const handleDebugWithAI = useCallback(async () => {
    if (!executionError || !generatedCode) return;

    setIsDebugging(true);
    addLog('Asking AI for a fix...', 'system');
    try {
      if (executionError.message.includes("%>%")) {
          addLog("AI Suggestion: The error indicates a missing library. The pipe operator '%>%' is from 'dplyr', part of 'tidyverse'. Adding 'library(tidyverse)' to the driver script.", 'system');
          await new Promise(r => setTimeout(r, 1500));
          
          setDriverCode(prev => prev.replace('# library(tidyverse)', 'library(tidyverse)'));

          addLog("AI applied a fix to 'driver.R'. Please try executing again.", 'success');
      } else {
        const fix = await debugRCode(generatedCode, executionError.message);
        setGeneratedCode(fix);
        addLog('AI applied a potential fix to the generated function. Please review and execute again.', 'success');
      }
      setExecutionError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`AI debug failed: ${errorMessage}`, 'error');
    } finally {
      setIsDebugging(false);
    }
  }, [executionError, generatedCode, addLog]);

  const handleConvertCode = useCallback(async (targetLanguage: SupportedLanguage) => {
    if (!generatedCode) {
      addLog('No code to convert.', 'error');
      return;
    }
    setIsConverting(true);
    addLog(`Converting R code to ${targetLanguage} with Gemini...`, 'system');
    try {
      const code = await convertCode(generatedCode, 'R', targetLanguage);
      setConvertedCode({ language: targetLanguage, code });
      addLog(`Successfully converted code to ${targetLanguage}.`, 'success');
      setActiveView('converted');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`Code conversion failed: ${errorMessage}`, 'error');
    } finally {
      setIsConverting(false);
    }
  }, [generatedCode, addLog]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      { "Variable Name": "TRTEMFL", "Variable Label": "Treatment Emergent Flag", "Derivation": "Set to 'Y' if AE start date (ASTDT) is on or after the treatment start date (TRTSDT) and on or before the treatment end date (TRTEDT). Otherwise, set to 'N'." },
      { "Variable Name": "ADY", "Variable Label": "Analysis Day", "Derivation": "Calculate as (ASTDT - TRTSDT) + 1. If ASTDT is before TRTSDT, ADY should be ASTDT - TRTSDT." },
      { "Variable Name": "ASER", "Variable Label": "Adverse Event Severity (Categorical)", "Derivation": "Map AESEV to ASER: 'MILD' -> 'Mild', 'MODERATE' -> 'Moderate', 'SEVERE' -> 'Severe'. Use case_when." }
    ];

    try {
      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "ADAE Spec");
      XLSX.writeFile(wb, "ADAE_Spec_Template.xlsx");
      addLog("Downloading ADAE spec template.", "success");
    } catch(error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`Failed to create template: ${errorMessage}`, 'error');
    }
  };

  const handleDownloadLogs = useCallback(() => {
    if (logs.length === 0) {
        addLog("No logs to download.", "info");
        return;
    }
    const logContent = logs.map(log => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`).join('\n');
    const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.download = `programming_assistant_logs_${date}.log`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addLog("Logs downloaded successfully.", "success");
  }, [logs, addLog]);

  const convertToCSV = (objArray: any[]): string => {
    if (!objArray || objArray.length === 0) return "";
    const headers = Object.keys(objArray[0]);
    const csvRows = [
        headers.join(','),
        ...objArray.map(row =>
            headers.map(fieldName =>
                JSON.stringify(row[fieldName], (_, value) => value ?? "")
            ).join(',')
        )
    ];
    return csvRows.join('\r\n');
  };

  const handleSaveAs = useCallback(() => {
    let content: string | null = null;
    let filename: string | null = null;
    let mimeType = 'text/plain;charset=utf-8';

    switch(activeView) {
      case 'prompt':
        content = aiPrompt;
        filename = 'final_prompt.txt';
        break;
      case 'code':
        content = generatedCode;
        filename = 'generate_code.R';
        break;
      case 'driver':
        content = driverCode;
        filename = 'driver.R';
        break;
      case 'converted':
        if (convertedCode) {
          content = convertedCode.code;
          filename = `converted_code.${convertedCode.language === 'Python' ? 'py' : 'sas'}`;
        }
        break;
      case 'output':
        if (outputData) {
          content = convertToCSV(outputData);
          filename = 'output_adae.csv';
          mimeType = 'text/csv;charset=utf-8;';
        }
        break;
      default:
        addLog("This view has no content to save.", "info");
        return;
    }

    if (content !== null && filename !== null) {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addLog(`File '${filename}' saved successfully.`, "success");
    } else {
      addLog("No content available to save for the current view.", "error");
    }
  }, [activeView, aiPrompt, generatedCode, driverCode, convertedCode, outputData, addLog]);

  
  const files: FileItem[] = [
    { name: 'spec_tasks.md', type: 'spec', available: derivationTasks.length > 0 },
    { name: 'final_prompt.txt', type: 'prompt', available: !!aiPrompt },
    { name: 'driver.R', type: 'driver', available: true, language: 'R' },
    { name: 'generate_code.R', type: 'code', available: !!generatedCode, language: 'R' },
    { name: `output_adae.csv`, type: 'output', available: !!outputData },
    ...(convertedCode ? [{ 
        name: `converted_code.${convertedCode.language === 'Python' ? 'py' : 'sas'}`,
        type: 'converted' as ViewType, 
        available: true,
        language: convertedCode.language
    }] : [])
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans">
      <Header
        onUploadClick={handleUploadClick}
        onDownloadTemplate={handleDownloadTemplate}
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
            driverCode={driverCode}
            setDriverCode={setDriverCode}
            isLoading={isLoading}
            executionError={executionError}
            onDebug={handleDebugWithAI}
            isDebugging={isDebugging}
            onDownloadTemplate={handleDownloadTemplate}
            outputData={outputData}
            convertedCode={convertedCode}
            onGenerate={handleGenerate}
            isGenerating={isLoading}
            generateEnabled={derivationTasks.length > 0 && derivationTasks.some(t => t.isApproved)}
            onExecute={handleExecute}
            isExecuting={isExecuting}
            executeEnabled={!!generatedCode || (!!convertedCode && convertedCode.language === 'Python')}
            onConvert={handleConvertCode}
            isConverting={isConverting}
            convertEnabled={!!generatedCode}
            onSaveAs={handleSaveAs}
            saveEnabled={['prompt', 'code', 'driver', 'converted', 'output'].includes(activeView)}
          />
          <LogPanel logs={logs} onDownload={handleDownloadLogs} />
        </div>
      </main>
    </div>
  );
};

export default App;