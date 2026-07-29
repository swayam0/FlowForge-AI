import { ExecutionContext } from '../interfaces/ExecutionContext';
import { ExecutionResult } from '../interfaces/ExecutionResult';
import { WorkflowStepExecutor } from '../interfaces/WorkflowStepExecutor';
import { MockActionModel } from '../../models/MockAction';
import { generatePayloadHash } from '../helpers/hashHelper';

export class MockActionExecutor implements WorkflowStepExecutor {
  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const config = context.currentNode.configuration;
    const actionId = config?.actionId || context.currentNode.id;
    const actionType = config?.actionType || 'GENERIC_MOCK_ACTION';
    
    // We simulate creating a payload from previous outputs
    const payload = { ...context.previousOutputs };
    const payloadHash = generatePayloadHash(payload);

    // Idempotency Check
    const existingAction = await MockActionModel.findOne({
      executionId: context.executionId,
      actionId,
      payloadHash,
    });

    if (existingAction) {
      return {
        status: 'SUCCESS',
        output: {
          skipped: true,
          message: 'Duplicate prevention: action already executed.',
          executedAt: existingAction.executedAt,
        },
      };
    }

    // Simulate action execution (e.g. sending an email, calling an API)
    // ...

    // Store the record
    const mockAction = new MockActionModel({
      executionId: context.executionId,
      actionId,
      actionType,
      payloadHash,
    });
    
    await mockAction.save();

    return {
      status: 'SUCCESS',
      output: {
        skipped: false,
        message: 'Mock action executed successfully.',
        actionType,
      },
    };
  }
}
