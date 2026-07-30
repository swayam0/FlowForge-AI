import { WorkflowStepType, WorkflowStatus, Position } from './common';

export interface WorkflowNode {
  id: string;
  type: WorkflowStepType;
  label: string;
  configuration: Record<string, unknown>; // Flexible config depending on step type
  position: Position;
  permissions?: string[]; // e.g. roles that can view/edit this node or approve it
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  sourceHandle?: string;
  targetHandle?: string;
  condition?: Record<string, unknown>;
}

export interface Workflow {
  id: string; // we can use mongoose _id mapped to id
  name: string;
  description?: string;
  version: number;
  status: WorkflowStatus;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  versionNumber: number;
  snapshot: Omit<Workflow, 'id' | 'status' | 'version' | 'createdAt' | 'updatedAt'>;
  createdAt: Date;
}
