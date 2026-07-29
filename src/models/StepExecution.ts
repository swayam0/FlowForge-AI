import mongoose, { Schema, Document } from 'mongoose';
import { StepExecution } from '../types/workflowRun';
import { ExecutionStatus } from '../types/common';

export interface IStepExecution extends Omit<StepExecution, 'id'>, Document {}

const StepExecutionSchema = new Schema<IStepExecution>({
  runId: { type: String, required: true, index: true },
  stepId: { type: String },
  attemptNumber: { type: Number, required: true, default: 1 },
  status: { type: String, enum: Object.values(ExecutionStatus), required: true },
  input: { type: Schema.Types.Mixed },
  output: { type: Schema.Types.Mixed },
  reason: { type: String },

  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
});

export const StepExecutionModel = mongoose.models.StepExecution || mongoose.model<IStepExecution>('StepExecution', StepExecutionSchema);
