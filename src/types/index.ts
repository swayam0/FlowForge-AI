export interface WorkflowNodeData {
  label: string;
  [key: string]: unknown;
}

export interface WorkflowNode {
  id: string;
  type: string;
  data: WorkflowNodeData;
  position: { x: number; y: number };
  configuration?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  [key: string]: unknown;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface ExecutionLog {
  id: string;
  executionId: string;
  stepId?: string;
  timestamp: string;
  eventType: string;
  message: string;
  reason?: string;
  metadata?: {
    latencyMs?: number;
    [key: string]: unknown;
  };
}

export interface StepExecution {
  stepId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'WAITING_APPROVAL';
  startTime?: string;
  endTime?: string;
  durationMs?: number;
  error?: string;
  outputs?: Record<string, unknown>;
}

export interface Execution {
  id: string;
  workflowId: string;
  workflowVersionId?: string;
  version?: number;
  executionPath?: string[];
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'SUCCESS' | 'FAILED' | 'WAITING_APPROVAL' | 'PAUSED' | 'CANCELLED';
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  currentStepId?: string;
  steps: StepExecution[];
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
}

export interface Approval {
  id: string;
  executionId: string;
  stepId: string;
  workflowId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestPayload: Record<string, unknown>;
  responsePayload?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  workflowName?: string;
  priority?: string;
  timestamp?: string;
}

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  versionNumber: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
}

export interface NodeDiff {
  id: string;
  type: string;
  before?: WorkflowNode;
  after?: WorkflowNode;
}

export interface VersionDiff {
  nodes: {
    added: WorkflowNode[];
    deleted: WorkflowNode[];
    modified: {
      id: string;
      before: WorkflowNode;
      after: WorkflowNode;
    }[];
  };
  edges: {
    added: WorkflowEdge[];
    deleted: WorkflowEdge[];
  };
}

export interface ConditionConfig {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'exists';
  value?: unknown;
}

export interface ApiError extends Error {
  status?: number;
  code?: string;
}
