import { ExecutionStatus, EventType, ApprovalStatus } from './common';

export interface WorkflowRun {
  id: string;
  workflowVersionId: string;
  status: ExecutionStatus;
  input: Record<string, any>;
  createdAt: Date;
}

export interface StepExecution {
  id: string;
  runId: string;
  stepId: string;
  attemptNumber: number;
  status: ExecutionStatus; // Usually RUNNING, COMPLETED, FAILED, PAUSED
  input?: Record<string, any>;
  output?: Record<string, any>;
  reason?: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface Approval {
  id: string;
  executionId: string;
  nodeId: string;
  reviewer: string; // User ID required for approval
  status: ApprovalStatus;
  comments?: string;
  approvedAt?: Date;
}

export interface MockAction {
  id: string;
  executionId: string;
  actionId: string; // ID from the workflow configuration representing this specific action
  actionType: string;
  payloadHash: string; // Hash of the input to ensure idempotency
  executedAt: Date;
}
