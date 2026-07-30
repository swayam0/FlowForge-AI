import { z } from 'zod';

export const ExecuteWorkflowSchema = z.object({
  input: z.record(z.string(), z.any()).default({}),
});

export const UpdateSettingsSchema = z.object({
  provider: z.enum(['gemini']),
  key: z.string().min(1, "API key is required"),
});

export const EmptyBodySchema = z.object({}).passthrough().optional();

export const RerunWorkflowSchema = z.object({
  input: z.record(z.string(), z.any()).optional(),
});
