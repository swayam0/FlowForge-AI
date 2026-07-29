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
      const log = new StepExecutionModel({
        runId,
        stepId,
        eventType,
        reason: message,
        status: 'RUNNING', // Fallback status if just logging an event via LoggingService
        metadata,
      });
      await log.save();
      console.log(`[${eventType}] ${message}`); // Also log to console for development
    } catch (error) {
      console.error('Failed to log execution:', error);
    }
  }
}
