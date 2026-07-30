export enum AuditEventType {
  // Workflow lifecycle
  WORKFLOW_CREATED = 'WORKFLOW_CREATED',
  WORKFLOW_UPDATED = 'WORKFLOW_UPDATED',
  WORKFLOW_PUBLISHED = 'WORKFLOW_PUBLISHED',
  WORKFLOW_ARCHIVED = 'WORKFLOW_ARCHIVED',
  WORKFLOW_DELETED = 'WORKFLOW_DELETED',
  // Version
  VERSION_CREATED = 'VERSION_CREATED',
  VERSION_ROLLED_BACK = 'VERSION_ROLLED_BACK',
  // Execution lifecycle
  EXECUTION_STARTED = 'EXECUTION_STARTED',
  EXECUTION_COMPLETED = 'EXECUTION_COMPLETED',
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  EXECUTION_CANCELLED = 'EXECUTION_CANCELLED',
  EXECUTION_RESUMED = 'EXECUTION_RESUMED',
  RETRY_TRIGGERED = 'RETRY_TRIGGERED',
  // Approval
  APPROVAL_REQUESTED = 'APPROVAL_REQUESTED',
  APPROVAL_APPROVED = 'APPROVAL_APPROVED',
  APPROVAL_REJECTED = 'APPROVAL_REJECTED',
  APPROVAL_EDITED = 'APPROVAL_EDITED',
  // AI & external
  AI_CALLED = 'AI_CALLED',
  EXTERNAL_ACTION_INVOKED = 'EXTERNAL_ACTION_INVOKED',
  // System
  USER_LOGGED_IN = 'USER_LOGGED_IN',
  SETTINGS_CHANGED = 'SETTINGS_CHANGED',
  PERMISSION_CHANGED = 'PERMISSION_CHANGED',
}

export type AuditResourceType = 
  | 'WORKFLOW' 
  | 'EXECUTION' 
  | 'APPROVAL' 
  | 'VERSION'
  | 'AI_CALL'
  | 'SETTINGS'
  | 'USER';

export interface AuditLogEntry {
  id: string;
  eventType: AuditEventType;
  resourceType: AuditResourceType;
  resourceId: string;
  workflowId?: string;
  runId?: string;
  actor: string;
  summary: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  createdAt: Date;
}
