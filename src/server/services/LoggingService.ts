import { StepExecutionModel } from '../../models/StepExecution';
import { EventType } from '../../types/common';

export class LoggingService {
  async log(
    runId: string,
    eventType: EventType,
    message: string,
    stepId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // We no longer save logs to StepExecutionModel to prevent corrupting the event sourcing reducer.
      // Actual node executions are safely recorded by WorkflowEngine.executeNode.
      console.log(`[${eventType}] ${message}`); 
    } catch (error) {
      console.error('Failed to log execution:', error);
    }
  }
}
