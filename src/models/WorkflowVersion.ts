import mongoose, { Schema, Document } from 'mongoose';
import { WorkflowVersion } from '../types/workflow';

export interface IWorkflowVersion extends Omit<WorkflowVersion, 'id'>, Document {}

const WorkflowVersionSchema = new Schema<IWorkflowVersion>({
  workflowId: { type: String, required: true, index: true },
  versionNumber: { type: Number, required: true },
  snapshot: { type: Schema.Types.Mixed, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

// Compound index to ensure uniqueness of version numbers per workflow
WorkflowVersionSchema.index({ workflowId: 1, versionNumber: 1 }, { unique: true });

export const WorkflowVersionModel = mongoose.models.WorkflowVersion || mongoose.model<IWorkflowVersion>('WorkflowVersion', WorkflowVersionSchema);
