import { Workflow, WorkflowNode, WorkflowVersion } from '../../types/workflow';

export interface ExecutionContext {
  executionId: string;
  workflow: Workflow;
  workflowVersion: WorkflowVersion;
  currentNode: WorkflowNode;
  input: Record<string, unknown>;
  previousOutputs: Record<string, unknown>;
  executionPath: string[];
  metadata: Record<string, unknown>;
  retryCount: number;
}
