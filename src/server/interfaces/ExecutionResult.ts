export interface ExecutionResult {
  status: 'SUCCESS' | 'FAILED' | 'WAITING_APPROVAL';
  output: any;
  nextNodeId?: string;
  reason?: string;
}
