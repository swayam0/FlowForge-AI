import { ExecutionContext } from '../interfaces/ExecutionContext';
import { ExecutionResult } from '../interfaces/ExecutionResult';
import { WorkflowStepExecutor } from '../interfaces/WorkflowStepExecutor';

export class RetrievalExecutor implements WorkflowStepExecutor {
  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    // Mock document retrieval
    return {
      status: 'SUCCESS',
      output: {
        documents: ['Mock document 1', 'Mock document 2'],
      },
    };
  }
}
