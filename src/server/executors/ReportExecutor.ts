import { ExecutionContext } from '../interfaces/ExecutionContext';
import { ExecutionResult } from '../interfaces/ExecutionResult';
import { WorkflowStepExecutor } from '../interfaces/WorkflowStepExecutor';

export class ReportExecutor implements WorkflowStepExecutor {
  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    // Deep copy previousOutputs to prevent circular references when the engine adds this output back to previousOutputs
    const summaryCopy = JSON.parse(JSON.stringify(context.previousOutputs));

    const reportData = {
      executionId: context.executionId,
      totalSteps: context.executionPath.length,
      summary: summaryCopy,
    };
    
    return {
      status: 'SUCCESS',
      output: {
        report: reportData,
      },
    };
  }
}
