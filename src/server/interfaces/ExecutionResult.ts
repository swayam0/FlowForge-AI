export interface ExecutionResult {
  status: 'SUCCESS' | 'FAILED' | 'WAITING_APPROVAL';
  output: Record<string, unknown> | unknown;
  nextNodeId?: string;
  reason?: string;
}
