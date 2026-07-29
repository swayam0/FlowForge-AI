import { ExecutionContext } from './ExecutionContext';
import { ExecutionResult } from './ExecutionResult';

export interface WorkflowStepExecutor {
  execute(context: ExecutionContext): Promise<ExecutionResult>;
}
