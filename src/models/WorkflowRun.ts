import mongoose, { Schema, Document } from 'mongoose';
import { WorkflowRun } from '../types/workflowRun';
import { ExecutionStatus } from '../types/common';

export interface IWorkflowRun extends Omit<WorkflowRun, 'id'>, Document { id: string; }

const WorkflowRunSchema = new Schema<IWorkflowRun>({
  workflowVersionId: { type: String, required: true, index: true },
  status: { type: String, enum: Object.values(ExecutionStatus), default: ExecutionStatus.PENDING },
  input: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: { createdAt: true, updatedAt: false }, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export const WorkflowRunModel = mongoose.models.WorkflowRun || mongoose.model<IWorkflowRun>('WorkflowRun', WorkflowRunSchema);
