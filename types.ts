export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'system';
}

export type ViewType = 'spec' | 'prompt' | 'code' | 'driver' | 'output' | 'converted';
export type SupportedLanguage = 'R' | 'Python' | 'SAS';

export interface FileItem {
  name: string;
  type: ViewType;
  available: boolean;
  language?: SupportedLanguage;
}

export interface DerivationTask {
  id: number;
  variable: string;
  label: string;
  derivation: string;
  prompt: string;
  isApproved: boolean;
}

export interface ExecutionError {
  message: string;
  line?: number;
}

export interface ConvertedCode {
  language: SupportedLanguage;
  code: string;
}
