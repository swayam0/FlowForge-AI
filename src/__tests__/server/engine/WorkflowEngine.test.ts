import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WorkflowEngine } from '@/server/engine/WorkflowEngine';
import { WorkflowRepository } from '@/repositories/WorkflowRepository';
import { WorkflowRunRepository } from '@/repositories/WorkflowRunRepository';
import { LoggingService } from '@/server/services/LoggingService';
import { WorkflowStepType, ExecutionStatus, EventType } from '@/types/common';
import { WorkflowRunModel } from '@/models/WorkflowRun';
import { ApprovalModel } from '@/models/Approval';
import { StepExecutionModel } from '@/models/StepExecution';
import { WorkflowVersionModel } from '@/models/WorkflowVersion';
import mongoose from 'mongoose';

vi.mock('@/server/ai/AIService', () => {
  return {
    AIService: class {
      extract = vi.fn().mockResolvedValue({ extracted: true });
      classify = vi.fn().mockResolvedValue({ priority: 'HIGH' });
    }
  };
});

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;
  let workflowRepo: WorkflowRepository;
  let runRepo: WorkflowRunRepository;
  let loggingService: LoggingService;

  beforeEach(() => {
    workflowRepo = new WorkflowRepository();
    runRepo = new WorkflowRunRepository();
    loggingService = new LoggingService();
    vi.spyOn(loggingService, 'log').mockResolvedValue();
    engine = new WorkflowEngine(workflowRepo, runRepo, loggingService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should execute a simple condition properly', async () => {
    const workflow = await workflowRepo.create({
      name: 'Condition Test',
      nodes: [
        { id: 'node-1', type: WorkflowStepType.STRUCTURED_INPUT, label: 'Start', configuration: {}, position: { x: 0, y: 0 } },
        { id: 'node-2', type: WorkflowStepType.DETERMINISTIC_CONDITION, label: 'Condition', configuration: {
          field: 'node-1.providedInput.value',
          operator: 'equals',
          value: 'test'
        }, position: { x: 0, y: 0 } },
        { id: 'node-3', type: WorkflowStepType.FINAL_REPORT, label: 'True Branch', configuration: {}, position: { x: 0, y: 0 } },
        { id: 'node-4', type: WorkflowStepType.FINAL_REPORT, label: 'False Branch', configuration: {}, position: { x: 0, y: 0 } },
      ],
      edges: [
        { id: 'e1', source: 'node-1', target: 'node-2' },
        { id: 'e2', source: 'node-2', target: 'node-3', sourceHandle: 'true', condition: { result: true } },
        { id: 'e3', source: 'node-2', target: 'node-4', sourceHandle: 'false', condition: { result: false } },
      ]
    }, 'system');

    const version = await WorkflowVersionModel.findOne({ workflowId: workflow.id });

    // Test True branch
    const execId = await engine.startRun(version.id, { value: 'test' });
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const run = await runRepo.getById(execId);
    expect(run?.status).toBe(ExecutionStatus.COMPLETED);
    
    const stepsTrue = await StepExecutionModel.find({ runId: execId }).exec();
    const pathsTrue = stepsTrue.map(s => s.stepId);
    expect(pathsTrue).toContain('node-3');
    expect(pathsTrue).not.toContain('node-4');

    // Test False branch
    const execIdFalse = await engine.startRun(version.id, { value: 'wrong' });
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const runFalse = await runRepo.getById(execIdFalse);
    expect(runFalse?.status).toBe(ExecutionStatus.COMPLETED);
    
    const stepsFalse = await StepExecutionModel.find({ runId: execIdFalse }).exec();
    const pathsFalse = stepsFalse.map(s => s.stepId);
    expect(pathsFalse).toContain('node-4');
    expect(pathsFalse).not.toContain('node-3');
  });

  it('should pause and resume on Human Approval', async () => {
    const workflow = await workflowRepo.create({
      name: 'Approval Test',
      nodes: [
        { id: 'node-1', type: WorkflowStepType.STRUCTURED_INPUT, label: 'Start', configuration: {}, position: { x: 0, y: 0 } },
        { id: 'node-2', type: WorkflowStepType.HUMAN_APPROVAL, label: 'Approval', configuration: {}, position: { x: 0, y: 0 } },
        { id: 'node-3', type: WorkflowStepType.FINAL_REPORT, label: 'End', configuration: {}, position: { x: 0, y: 0 } }
      ],
      edges: [
        { id: 'e1', source: 'node-1', target: 'node-2' },
        { id: 'e2', source: 'node-2', target: 'node-3' }
      ]
    }, 'system');

    const version = await WorkflowVersionModel.findOne({ workflowId: workflow.id });
    const execId = await engine.startRun(version.id, {});
    await new Promise(resolve => setTimeout(resolve, 200));

    // Should be paused
    const pausedRun = await runRepo.getById(execId);
    expect(pausedRun?.status).toBe(ExecutionStatus.PAUSED);
    
    const pausedSteps = await StepExecutionModel.find({ runId: execId, stepId: 'node-2' }).exec();
    expect(pausedSteps[0].status).toBe(ExecutionStatus.PAUSED);

    // Emulate approval by updating ApprovalModel
    await ApprovalModel.findOneAndUpdate(
      { executionId: execId, nodeId: 'node-2' },
      { $set: { status: 'APPROVED', comments: 'Looks good' } },
      { upsert: true }
    );

    // Resume
    await engine.resumeRun(execId);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Should be completed
    const resumedRun = await runRepo.getById(execId);
    expect(resumedRun?.status).toBe(ExecutionStatus.COMPLETED);
    
    const resumedSteps = await StepExecutionModel.find({ runId: execId }).exec();
    const paths = resumedSteps.map(s => s.stepId);
    expect(paths).toContain('node-3');
  });

  it('should exhibit idempotency for write actions on retry', async () => {
    const workflow = await workflowRepo.create({
      name: 'Idempotency Test',
      nodes: [
        { id: 'start', type: WorkflowStepType.STRUCTURED_INPUT, label: 'Start', configuration: {}, position: { x: 0, y: 0 } },
        { id: 'node-1', type: WorkflowStepType.MOCK_EXTERNAL_ACTION, label: 'Action 1', configuration: { actionType: 'HTTP POST' }, position: { x: 0, y: 0 } },
        { id: 'node-2', type: WorkflowStepType.FINAL_REPORT, label: 'End', configuration: {}, position: { x: 0, y: 0 } }
      ],
      edges: [
        { id: 'e0', source: 'start', target: 'node-1' },
        { id: 'e1', source: 'node-1', target: 'node-2' }
      ]
    }, 'system');

    const version = await WorkflowVersionModel.findOne({ workflowId: workflow.id });
    const execId = await engine.startRun(version.id, {});
    await new Promise(resolve => setTimeout(resolve, 200));

    // After first run, IdempotencyRecord should exist
    const cachedRecord = await mongoose.models.IdempotencyRecord.findOne({ idempotencyKey: `${execId}:node-1` });
    expect(cachedRecord).toBeDefined();
    expect(cachedRecord.status).toBe('SUCCESS');

    // Simulate engine crash on node-1 by setting its status back to RUNNING
    // But IdempotencyRecord is already created.
    await StepExecutionModel.findOneAndUpdate(
      { runId: execId, stepId: 'node-1' },
      { $set: { status: ExecutionStatus.RUNNING } }
    );
    // Delete node-2 so it looks like we crashed during node-1 completion phase
    await StepExecutionModel.findOneAndDelete({ runId: execId, stepId: 'node-2' });
    await WorkflowRunModel.findByIdAndUpdate(execId, { status: ExecutionStatus.FAILED });

    // Recover execution
    await engine.retryRun(execId);
    await new Promise(resolve => setTimeout(resolve, 200));

    // The output should be restored via Idempotency cache without failing node-1 again
    const steps = await StepExecutionModel.find({ runId: execId, stepId: 'node-1' }).sort({ startedAt: 1 }).exec();
    expect(steps.length).toBeGreaterThan(1);
    expect(steps[steps.length - 1].reason).toBe('Skipped via Idempotency Check');

    // Verify LoggingService was called with IDEMPOTENCY_SKIP
    expect(loggingService.log).toHaveBeenCalledWith(execId, EventType.IDEMPOTENCY_SKIP, expect.stringContaining('due to idempotency'), 'node-1');
  });
});
