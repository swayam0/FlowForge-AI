import { z } from 'zod';
import { ExecutionStatus, EventType, ApprovalStatus } from '../types/common';

export const StartRunSchema = z.object({
  workflowVersionId: z.string().min(1),
  input: z.record(z.string(), z.any()).default({}),
});

export const UpdateRunStatusSchema = z.object({
  status: z.nativeEnum(ExecutionStatus),
});

export const CreateStepExecutionSchema = z.object({
  runId: z.string().min(1),
  stepId: z.string().min(1),
  attemptNumber: z.number().int().positive().default(1),
  status: z.nativeEnum(ExecutionStatus),
  input: z.record(z.string(), z.any()).optional(),
  output: z.record(z.string(), z.any()).optional(),
  reason: z.string().optional(),
});

export const SubmitApprovalSchema = z.object({
  status: z.enum([ApprovalStatus.APPROVED, ApprovalStatus.REJECTED]),
  comments: z.string().optional(),
  reviewer: z.string().min(1),
});

export const CreateMockActionSchema = z.object({
  executionId: z.string().min(1),
  actionId: z.string().min(1),
  actionType: z.string().min(1),
  payloadHash: z.string().min(1),
});
