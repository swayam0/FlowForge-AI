import mongoose, { Schema, Document } from 'mongoose';
import { Approval } from '../types/workflowRun';
import { ApprovalStatus } from '../types/common';

export interface IApproval extends Omit<Approval, 'id'>, Document {}

const ApprovalSchema = new Schema<IApproval>({
  executionId: { type: String, required: true, index: true },
  nodeId: { type: String, required: true },
  reviewer: { type: String, required: true },
  status: { type: String, enum: Object.values(ApprovalStatus), default: ApprovalStatus.PENDING },
  comments: { type: String },
  approvedAt: { type: Date },
}, { timestamps: true });

ApprovalSchema.index({ createdAt: -1 });
ApprovalSchema.index({ status: 1 });

export const ApprovalModel = mongoose.models.Approval || mongoose.model<IApproval>('Approval', ApprovalSchema);
