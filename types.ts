export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'system';
}

export type ViewType = 'spec' | 'prompt' | 'code';

export interface FileItem {
  name: string;
  type: ViewType;
  available: boolean;
}

export interface DerivationTask {
  id: number;
  variable: string;
  label: string;
  derivation: string;
  prompt: string;
  isApproved: boolean;
}
