import { WorkflowRunModel } from '../../models/WorkflowRun';
import { StepExecutionModel } from '../../models/StepExecution';
import { ApprovalModel } from '../../models/Approval';
import { WorkflowVersionModel } from '../../models/WorkflowVersion';
import { WorkflowModel } from '../../models/Workflow';
import { WorkflowStepType, ExecutionStatus } from '../../types/common';
import {
  ExecutionExplanation,
  ExplanationStep,
  ExplanationStepStatus,
  ExplanationApproval,
} from '../../types/explanation';
import { WorkflowNode } from '../../types/workflow';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a WorkflowStepType to a display-friendly label. */
function nodeTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    [WorkflowStepType.STRUCTURED_INPUT]:       'Structured Input',
    [WorkflowStepType.DOCUMENT_RETRIEVAL]:     'Document Retrieval',
    [WorkflowStepType.AI_EXTRACTION]:          'AI Extraction',
    [WorkflowStepType.AI_CLASSIFICATION]:      'AI Classification',
    [WorkflowStepType.DETERMINISTIC_CONDITION]:'Condition Check',
    [WorkflowStepType.HUMAN_APPROVAL]:         'Human Approval',
    [WorkflowStepType.MOCK_EXTERNAL_ACTION]:   'External Action',
    [WorkflowStepType.FINAL_REPORT]:           'Final Report',
    // lowercase aliases used by some seeded workflows
    structured_input:       'Structured Input',
    document_retrieval:     'Document Retrieval',
    ai_extraction:          'AI Extraction',
    ai_classification:      'AI Classification',
    deterministic_condition:'Condition Check',
    human_approval:         'Human Approval',
    mock_external_action:   'External Action',
    final_report:           'Final Report',
  };
  return labels[type] ?? type;
}

/** Normalise ExecutionStatus → ExplanationStepStatus. */
function mapStepStatus(status: string): ExplanationStepStatus {
  switch (status) {
    case ExecutionStatus.COMPLETED: return 'completed';
    case ExecutionStatus.FAILED:    return 'failed';
    case ExecutionStatus.PAUSED:    return 'waiting_approval';
    default:                        return 'skipped';
  }
}

/** Extract a confidence score (0-100) from a step's output payload, if present. */
function extractConfidence(output: Record<string, unknown> | null | undefined): number | null {
  if (!output) return null;

  // Try several common key patterns that AI executors may use
  const candidates = [
    output['confidence'],
    output['confidence_score'],
    output['score'],
    output['probability'],
  ];

  for (const val of candidates) {
    if (typeof val === 'number') {
      // Normalise to 0–100 scale
      return val > 1 ? Math.round(val) : Math.round(val * 100);
    }
  }
  return null;
}

/** Build a one-sentence summary describing the overall run. */
function buildSummary(
  workflowName: string,
  status: string,
  stepCount: number,
  durationMs: number,
): string {
  const seconds = (durationMs / 1000).toFixed(1);
  const statusMap: Record<string, string> = {
    COMPLETED:  'completed successfully',
    FAILED:     'failed',
    PAUSED:     'is paused awaiting human approval',
    CANCELLED:  'was cancelled',
    RUNNING:    'is still running',
    PENDING:    'is pending',
  };
  const statusPhrase = statusMap[status] ?? status.toLowerCase();
  return `The "${workflowName}" workflow ${statusPhrase} after executing ${stepCount} step${stepCount !== 1 ? 's' : ''} in ${seconds}s.`;
}

/** Build a one-sentence outcome for the final step. */
function buildOutcome(steps: ExplanationStep[], runStatus: string): string {
  const last = steps[steps.length - 1];
  if (!last) return 'No steps were executed.';

  if (runStatus === ExecutionStatus.COMPLETED) {
    return `Workflow completed at the "${last.name}" step${last.reason ? `: ${last.reason}` : '.'}`;
  }
  if (runStatus === ExecutionStatus.FAILED) {
    const failedStep = steps.find(s => s.status === 'failed');
    return failedStep
      ? `Workflow failed at step "${failedStep.name}": ${failedStep.reason ?? 'Unknown error'}.`
      : 'Workflow failed.';
  }
  if (runStatus === ExecutionStatus.PAUSED) {
    const pendingStep = steps.find(s => s.status === 'waiting_approval');
    return pendingStep
      ? `Workflow is paused, waiting for a human decision on "${pendingStep.name}".`
      : 'Workflow is paused awaiting approval.';
  }
  return `Workflow is in status: ${runStatus}.`;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class ExplanationService {
  /**
   * Generate a complete execution explanation for the given run ID.
   * Returns `null` if the run does not exist.
   */
  async generate(runId: string): Promise<ExecutionExplanation | null> {
    // 1. Load the run
    const run = await WorkflowRunModel.findById(runId).lean().exec();
    if (!run) return null;

    // 2. Load all step executions, sorted chronologically
    const stepExecutions = await StepExecutionModel
      .find({ runId })
      .sort({ startedAt: 1 })
      .lean()
      .exec();

    // 3. Resolve workflow node definitions (for labels / types)
    const workflowVersionId = run.workflowVersionId as string;
    let nodes: WorkflowNode[] = [];
    let workflowName = 'Workflow';

    const versionDoc = await WorkflowVersionModel.findById(workflowVersionId).lean().exec();
    if (versionDoc?.snapshot) {
      const snapshot = versionDoc.snapshot as { nodes?: WorkflowNode[]; name?: string };
      nodes = snapshot.nodes ?? [];
      workflowName = snapshot.name ?? workflowName;
    } else {
      // Fallback: try loading as a plain Workflow doc (demo seed path)
      const workflowDoc = await WorkflowModel.findById(workflowVersionId).lean().exec();
      if (workflowDoc) {
        nodes = (workflowDoc.nodes ?? []) as WorkflowNode[];
        workflowName = (workflowDoc.name as string) ?? workflowName;
      }
    }

    // Build a quick node lookup by ID
    const nodeMap = new Map<string, WorkflowNode>(nodes.map(n => [n.id, n]));

    // 4. Load all approval records for this run
    const approvals = await ApprovalModel
      .find({ executionId: runId })
      .lean()
      .exec();

    // Build a lookup: nodeId → approval
    const approvalMap = new Map(approvals.map(a => [a.nodeId, a]));

    // 5. Deduplicate step executions — keep only the latest attempt per stepId
    //    (retries produce multiple rows for the same stepId)
    const latestByStepId = new Map<string, typeof stepExecutions[number]>();
    for (const se of stepExecutions) {
      const existing = latestByStepId.get(se.stepId);
      if (!existing || se.attemptNumber > existing.attemptNumber) {
        latestByStepId.set(se.stepId, se);
      }
    }

    // 6. Build explanation steps in execution order
    const steps: ExplanationStep[] = [];
    for (const se of latestByStepId.values()) {
      const node = nodeMap.get(se.stepId);
      const nodeType = (node?.type as string) ?? 'unknown';
      const nodeName = node?.label ?? nodeTypeLabel(nodeType) ?? se.stepId;

      const durationMs =
        se.startedAt && se.completedAt
          ? new Date(se.completedAt).getTime() - new Date(se.startedAt).getTime()
          : null;

      // Confidence — only meaningful for AI steps
      const isAiStep = [
        WorkflowStepType.AI_EXTRACTION,
        WorkflowStepType.AI_CLASSIFICATION,
        'ai_extraction',
        'ai_classification',
      ].includes(nodeType as WorkflowStepType);

      const confidence = isAiStep
        ? extractConfidence(se.output as Record<string, unknown> | null)
        : null;

      // Approval decision
      let approval: ExplanationApproval | null = null;
      const approvalRecord = approvalMap.get(se.stepId);
      if (approvalRecord && approvalRecord.status !== 'PENDING') {
        approval = {
          decision: approvalRecord.status as 'APPROVED' | 'REJECTED',
          reviewer: approvalRecord.reviewer ?? 'Unknown',
          comment: approvalRecord.comments ?? null,
          resolvedAt: approvalRecord.approvedAt
            ? new Date(approvalRecord.approvedAt).toISOString()
            : null,
        };
      }

      steps.push({
        stepId: se.stepId,
        name: nodeName,
        type: nodeType,
        status: mapStepStatus(se.status as string),
        reason: (se.reason as string) ?? null,
        confidence,
        durationMs,
        approval,
      });
    }

    // 7. Compute aggregate fields
    const runStatus = run.status as string;
    const createdAt = (run as Record<string, unknown>)['createdAt'];
    const completedAt = (run as Record<string, unknown>)['completedAt'];

    let durationMs = 0;
    if (createdAt && completedAt) {
      durationMs = new Date(completedAt as string).getTime() - new Date(createdAt as string).getTime();
    } else if (createdAt) {
      durationMs = Date.now() - new Date(createdAt as string).getTime();
    }

    const decisionPath = steps.map(s => s.stepId);
    const summary = buildSummary(workflowName, runStatus, steps.length, durationMs);
    const outcome = buildOutcome(steps, runStatus);

    return {
      runId: String(run._id),
      summary,
      status: runStatus,
      durationMs,
      decisionPath,
      steps,
      outcome,
    };
  }
}
