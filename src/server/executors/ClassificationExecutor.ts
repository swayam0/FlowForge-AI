import { ExecutionContext } from '../interfaces/ExecutionContext';
import { ExecutionResult } from '../interfaces/ExecutionResult';
import { WorkflowStepExecutor } from '../interfaces/WorkflowStepExecutor';
import { AIService } from '../ai/AIService';

export class ClassificationExecutor implements WorkflowStepExecutor {
  constructor(private aiService: AIService) {}

  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const inputData = { ...context.input, ...context.previousOutputs };
    
    const result = await this.aiService.classify(context.executionId, context.currentNode.id, inputData);
    
    // Extract the reasoning if provided by the LLM
    const reasoning = result.reasoning || `AI classified input as ${result.priority || 'unknown'}`;
    
    return {
      status: 'SUCCESS',
      output: {
        classification: result,
      },
      reason: reasoning,
    };
  }
}
