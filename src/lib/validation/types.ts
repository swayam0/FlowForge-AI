import { WorkflowNode, WorkflowEdge } from '../../types/workflow';

export type ValidationSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';

export type ValidationCategory = 'Graph' | 'Configuration' | 'DataFlow' | 'Security' | 'AI' | 'Execution';

export interface ValidationIssue {
  id: string;
  categoryId: ValidationCategory;
  title: string;
  description: string;
  nodeId?: string; // If applicable
  severity: ValidationSeverity;
  suggestedFix?: string;
}

export interface ValidationResult {
  score: number;
  isValid: boolean; // true if no ERROR severity issues
  breakdown: Record<ValidationCategory, { score: number; maxScore: number }>;
  issues: ValidationIssue[];
}

export interface WorkflowContext {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface ValidationRule {
  id: string;
  category: ValidationCategory;
  description: string;
  evaluate: (workflow: WorkflowContext) => ValidationIssue[];
}
