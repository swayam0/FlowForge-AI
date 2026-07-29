import { ExecutionContext } from '../interfaces/ExecutionContext';
import { ExecutionResult } from '../interfaces/ExecutionResult';
import { WorkflowStepExecutor } from '../interfaces/WorkflowStepExecutor';
import { AIService } from '../ai/AIService';

export class ExtractionExecutor implements WorkflowStepExecutor {
  constructor(private aiService: AIService) {}

  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const inputData = { ...context.input, ...context.previousOutputs };
    
    const result = await this.aiService.extract(context.executionId, context.currentNode.id, inputData);
    
    return {
      status: 'SUCCESS',
      output: {
        extractedData: result,
      },
    };
  }
}
