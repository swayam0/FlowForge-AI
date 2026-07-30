/**
 * Unit tests for ExplanationService.
 *
 * MongoMemoryServer setup is provided globally via vitest.config.ts setupFiles.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { ExplanationService } from '@/server/services/ExplanationService';
import { WorkflowRunModel } from '@/models/WorkflowRun';
import { StepExecutionModel } from '@/models/StepExecution';
import { ApprovalModel } from '@/models/Approval';
import { WorkflowModel } from '@/models/Workflow';
import { ExecutionStatus, WorkflowStepType } from '@/types/common';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeId() {
  return new mongoose.Types.ObjectId().toString();
}

async function createRun(overrides: Record<string, unknown> = {}) {
  return WorkflowRunModel.create({
    workflowVersionId: makeId(),
    status: ExecutionStatus.COMPLETED,
    input: {},
    ...overrides,
  });
}

async function createStep(
  runId: string,
  stepId: string,
  overrides: Record<string, unknown> = {},
) {
  return StepExecutionModel.create({
    runId,
    stepId,
    attemptNumber: 1,
    status: ExecutionStatus.COMPLETED,
    input: {},
    output: {},
    startedAt: new Date(Date.now() - 1000),
    completedAt: new Date(),
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExplanationService', () => {
  let service: ExplanationService;

  beforeEach(() => {
    service = new ExplanationService();
  });

  // ── 1. Returns null for unknown runId ────────────────────────────────────

  it('returns null for an unknown runId', async () => {
    const result = await service.generate(makeId());
    expect(result).toBeNull();
  });

  // ── 2. Generates explanation for a completed run ─────────────────────────

  it('generates a valid explanation for a completed run', async () => {
    // Seed a minimal workflow so the service can resolve node names
    const workflow = await WorkflowModel.create({
      name: 'Invoice Triage',
      version: 1,
      status: WorkflowStatus.PUBLISHED,
      nodes: [
        { id: 'n1', type: WorkflowStepType.STRUCTURED_INPUT,    label: 'Start',          configuration: {}, position: { x: 0, y: 0 } },
        { id: 'n2', type: WorkflowStepType.AI_CLASSIFICATION,   label: 'Classify',       configuration: {}, position: { x: 0, y: 100 } },
        { id: 'n3', type: WorkflowStepType.FINAL_REPORT,        label: 'Final Report',   configuration: {}, position: { x: 0, y: 200 } },
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3' },
      ],
      createdBy: 'system',
    });

    const startedAt  = new Date(Date.now() - 4218);
    const completedAt = new Date();

    const run = await createRun({
      workflowVersionId: String(workflow._id),
      status: ExecutionStatus.COMPLETED,
    });

    // Manually set timestamps (the schema uses mixed fields not in defaults)
    await WorkflowRunModel.findByIdAndUpdate(run._id, { completedAt, createdAt: startedAt }).exec();

    await createStep(String(run._id), 'n1', {
      output: {},
      reason: 'Input validated',
      startedAt,
      completedAt: new Date(startedAt.getTime() + 100),
    });
    await createStep(String(run._id), 'n2', {
      output: { classification: 'HIGH', confidence: 0.96 },
      reason: 'Priority classified HIGH based on ticket urgency markers',
      startedAt: new Date(startedAt.getTime() + 100),
      completedAt: new Date(startedAt.getTime() + 3000),
    });
    await createStep(String(run._id), 'n3', {
      output: { summary: 'Report generated' },
      reason: 'Final report compiled',
      startedAt: new Date(startedAt.getTime() + 3000),
      completedAt,
    });

    const explanation = await service.generate(String(run._id));

    expect(explanation).not.toBeNull();
    expect(explanation!.runId).toBe(String(run._id));
    expect(explanation!.status).toBe(ExecutionStatus.COMPLETED);
    expect(explanation!.steps).toHaveLength(3);
    expect(explanation!.decisionPath).toEqual(['n1', 'n2', 'n3']);

    // Summary should mention the workflow name
    expect(explanation!.summary).toContain('Invoice Triage');

    // AI step should carry confidence
    const classifyStep = explanation!.steps.find(s => s.stepId === 'n2');
    expect(classifyStep).toBeDefined();
    expect(classifyStep!.status).toBe('completed');
    expect(classifyStep!.confidence).toBe(96);          // 0.96 → 96
    expect(classifyStep!.reason).toBe('Priority classified HIGH based on ticket urgency markers');

    // Non-AI step should have null confidence
    const startStep = explanation!.steps.find(s => s.stepId === 'n1');
    expect(startStep!.confidence).toBeNull();
  });

  // ── 3. Handles a failed step ─────────────────────────────────────────────

  it('marks a failed step correctly and reflects it in the outcome', async () => {
    const run = await createRun({ status: ExecutionStatus.FAILED });

    await createStep(String(run._id), 'step-ok');
    await createStep(String(run._id), 'step-fail', {
      status: ExecutionStatus.FAILED,
      reason: 'Gemini API quota exceeded',
    });

    const explanation = await service.generate(String(run._id));

    expect(explanation).not.toBeNull();
    const failedStep = explanation!.steps.find(s => s.status === 'failed');
    expect(failedStep).toBeDefined();
    expect(failedStep!.reason).toBe('Gemini API quota exceeded');

    expect(explanation!.outcome).toContain('failed');
  });

  // ── 4. Handles a paused run with an approval decision ───────────────────

  it('attaches approval decision to the correct step', async () => {
    const run = await createRun({ status: ExecutionStatus.PAUSED });
    const runId = String(run._id);

    await createStep(runId, 'input-node');
    await createStep(runId, 'approval-node', {
      status: ExecutionStatus.PAUSED,
      reason: 'Waiting for Human Approval',
    });

    // Create a resolved approval record
    await ApprovalModel.create({
      executionId: runId,
      nodeId: 'approval-node',
      reviewer: 'jane.doe',
      status: ApprovalStatus.APPROVED,
      comments: 'Looks good',
      approvedAt: new Date(),
    });

    const explanation = await service.generate(runId);

    expect(explanation).not.toBeNull();
    const approvalStep = explanation!.steps.find(s => s.stepId === 'approval-node');
    expect(approvalStep).toBeDefined();
    expect(approvalStep!.approval).not.toBeNull();
    expect(approvalStep!.approval!.decision).toBe('APPROVED');
    expect(approvalStep!.approval!.reviewer).toBe('jane.doe');
    expect(approvalStep!.approval!.comment).toBe('Looks good');
  });

  // ── 5. Deduplicates retried steps ────────────────────────────────────────

  it('deduplicates steps from retries — only the last attempt is included', async () => {
    const run = await createRun();
    const runId = String(run._id);

    // Attempt 1 — failed
    await createStep(runId, 'node-retry', {
      attemptNumber: 1,
      status: ExecutionStatus.FAILED,
      reason: 'Timeout',
    });
    // Attempt 2 — succeeded
    await createStep(runId, 'node-retry', {
      attemptNumber: 2,
      status: ExecutionStatus.COMPLETED,
      reason: 'Succeeded on retry',
    });

    const explanation = await service.generate(runId);

    expect(explanation).not.toBeNull();
    // Only one step entry for node-retry
    const retrySteps = explanation!.steps.filter(s => s.stepId === 'node-retry');
    expect(retrySteps).toHaveLength(1);
    // It should be the latest (attempt 2) — status completed
    expect(retrySteps[0].status).toBe('completed');
    expect(retrySteps[0].reason).toBe('Succeeded on retry');
  });

  // ── 6. Returns empty steps array for a run with no step executions ───────

  it('returns an explanation with zero steps if no StepExecutions exist', async () => {
    const run = await createRun({ status: ExecutionStatus.RUNNING });
    const explanation = await service.generate(String(run._id));

    expect(explanation).not.toBeNull();
    expect(explanation!.steps).toHaveLength(0);
    expect(explanation!.decisionPath).toHaveLength(0);
    expect(explanation!.outcome).toContain('No steps');
  });

  // ── 7. Computes durationMs from run timestamps ───────────────────────────

  it('computes durationMs — is a non-negative number', async () => {
    const run = await createRun({ status: ExecutionStatus.COMPLETED });
    const runId = String(run._id);

    await createStep(runId, 'step-1');

    const explanation = await service.generate(runId);
    expect(explanation).not.toBeNull();
    // durationMs should be a non-negative integer (exact value depends on timing)
    expect(typeof explanation!.durationMs).toBe('number');
    expect(explanation!.durationMs).toBeGreaterThanOrEqual(0);
  });

  // ── 8. Confidence normalisation ──────────────────────────────────────────

  it('normalises confidence from 0-1 float and 0-100 integer correctly', async () => {
    // Create a workflow with AI node types so the service treats them as AI steps
    const workflow = await WorkflowModel.create({
      name: 'Confidence Test WF',
      version: 1,
      status: WorkflowStatus.PUBLISHED,
      nodes: [
        { id: 'ai-step-1', type: WorkflowStepType.AI_CLASSIFICATION, label: 'Classify', configuration: {}, position: { x: 0, y: 0 } },
        { id: 'ai-step-2', type: WorkflowStepType.AI_EXTRACTION,   label: 'Extract',  configuration: {}, position: { x: 0, y: 100 } },
        { id: 'non-ai-step', type: WorkflowStepType.FINAL_REPORT,   label: 'Report',   configuration: {}, position: { x: 0, y: 200 } },
      ],
      edges: [],
      createdBy: 'system',
    });

    const run = await createRun({ workflowVersionId: String(workflow._id) });
    const runId = String(run._id);

    // Float confidence (0-1 range)
    await createStep(runId, 'ai-step-1', {
      status: ExecutionStatus.COMPLETED,
      output: { confidence: 0.87 },
    });

    // Integer confidence (0-100 range)
    await createStep(runId, 'ai-step-2', {
      status: ExecutionStatus.COMPLETED,
      output: { confidence: 73 },
    });

    // Non-AI step — confidence should be null
    await createStep(runId, 'non-ai-step', {
      status: ExecutionStatus.COMPLETED,
      output: { result: 'done' },
    });

    const explanation = await service.generate(runId);
    expect(explanation).not.toBeNull();

    // ai-step-1: 0.87 → 87
    const step1 = explanation!.steps.find(s => s.stepId === 'ai-step-1');
    expect(step1!.confidence).toBe(87);

    // ai-step-2: 73 → 73 (already in 0-100 range)
    const step2 = explanation!.steps.find(s => s.stepId === 'ai-step-2');
    expect(step2!.confidence).toBe(73);

    // non-ai-step: no confidence extracted
    const step3 = explanation!.steps.find(s => s.stepId === 'non-ai-step');
    expect(step3!.confidence).toBeNull();
  });
});
