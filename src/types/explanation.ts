/**
 * Shared types for the Execution Explainability feature.
 * These are pure data contracts — no runtime logic here.
 */

/** The status of an individual step within an explanation. */
export type ExplanationStepStatus =
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'waiting_approval';

/** An approval decision attached to an explanation step. */
export interface ExplanationApproval {
  decision: 'APPROVED' | 'REJECTED';
  reviewer: string;
  comment: string | null;
  resolvedAt: string | null;
}

/** A single step in the execution explanation. */
export interface ExplanationStep {
  /** The node ID from the workflow graph. */
  stepId: string;
  /** Human-readable node label from the workflow definition. */
  name: string;
  /** Node type (e.g. AI_CLASSIFICATION, HUMAN_APPROVAL). */
  type: string;
  /** Resolved execution status of this step. */
  status: ExplanationStepStatus;
  /** The engine's stored reason / AI rationale string for this step. */
  reason: string | null;
  /** AI confidence score (0–100), present only for AI steps. */
  confidence: number | null;
  /** How long this step took in milliseconds. */
  durationMs: number | null;
  /** Human approval decision, only populated for HUMAN_APPROVAL nodes. */
  approval: ExplanationApproval | null;
}

/** The full explanation payload for a workflow run. */
export interface ExecutionExplanation {
  /** MongoDB ObjectId of the WorkflowRun. */
  runId: string;
  /** A single human-readable sentence summarising the execution. */
  summary: string;
  /** Top-level execution status (maps to ExecutionStatus enum values). */
  status: string;
  /** Total wall-clock duration in milliseconds. */
  durationMs: number;
  /** Ordered list of node IDs that were actually executed. */
  decisionPath: string[];
  /** Per-step breakdown. */
  steps: ExplanationStep[];
  /** One-sentence outcome describing the final result. */
  outcome: string;
}
