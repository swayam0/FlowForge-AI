import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockActionExecutor } from '@/server/executors/MockActionExecutor';
import { MockActionModel } from '@/models/MockAction';
import { WorkflowStepType } from '@/types/common';

describe('MockActionExecutor', () => {
  let executor: MockActionExecutor;

  beforeEach(async () => {
    executor = new MockActionExecutor();
    await MockActionModel.deleteMany({});
  });

  it('should execute a new mock action successfully', async () => {
    const context: any = {
      executionId: 'exec-1',
      currentNode: {
        id: 'node-1',
        type: WorkflowStepType.MOCK_EXTERNAL_ACTION,
        configuration: { actionType: 'EMAIL' }
      },
      previousOutputs: { 'node-0': { data: 123 } }
    };

    const result = await executor.execute(context);
    
    expect(result.status).toBe('SUCCESS');
    expect(result.output.skipped).toBe(false);
    expect(result.output.actionType).toBe('EMAIL');

    const savedAction = await MockActionModel.findOne({ executionId: 'exec-1' });
    expect(savedAction).toBeTruthy();
  });

  it('should skip duplicate execution (idempotency)', async () => {
    const context: any = {
      executionId: 'exec-1',
      currentNode: {
        id: 'node-1',
        type: WorkflowStepType.MOCK_EXTERNAL_ACTION,
        configuration: { actionType: 'EMAIL' }
      },
      previousOutputs: { 'node-0': { data: 123 } }
    };

    // First execution
    await executor.execute(context);
    
    // Second execution with identical context
    const result2 = await executor.execute(context);

    expect(result2.status).toBe('SUCCESS');
    expect(result2.output.skipped).toBe(true);
    expect(result2.output.message).toContain('Duplicate');
  });
});
