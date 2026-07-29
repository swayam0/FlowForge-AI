import { ExecutionContext } from '../interfaces/ExecutionContext';
import { ExecutionResult } from '../interfaces/ExecutionResult';
import { WorkflowStepExecutor } from '../interfaces/WorkflowStepExecutor';

export class InputExecutor implements WorkflowStepExecutor {
  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const config = context.currentNode.configuration || {};
    
    // Structured input usually just takes the global execution input
    // and makes it available to the workflow, potentially validating it against a schema.
    
    return {
      status: 'SUCCESS',
      output: {
        providedInput: context.input,
      },
    };
  }
}
