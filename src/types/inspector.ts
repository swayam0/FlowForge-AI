export interface InspectorNodeData {
  id: string;
  label: string;
  type: string;
  configuration: Record<string, any>;
}

export interface InspectorStepData {
  id: string;
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  input: Record<string, any>;
  output: Record<string, any>;
  startedAt?: Date | string;
  completedAt?: Date | string;
  error?: string;
  metadata?: {
    latencyMs?: number;
    tokenUsage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    cost?: number;
    model?: string;
    reasoningSummary?: string;
    safetyStatus?: string;
    confidence?: number;
    workerId?: string;
    attemptNumber?: number;
    [key: string]: any;
  };
}
