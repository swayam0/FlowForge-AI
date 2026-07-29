import { Workflow, WorkflowNode, WorkflowVersion } from '../../types/workflow';

export interface ExecutionContext {
  executionId: string;
  workflow: Workflow;
  workflowVersion: WorkflowVersion;
  currentNode: WorkflowNode;
  input: Record<string, any>;
  previousOutputs: Record<string, any>;
  executionPath: string[];
  metadata: Record<string, any>;
  retryCount: number;
}
