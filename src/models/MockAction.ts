import mongoose, { Schema, Document } from 'mongoose';
import { MockAction } from '../types/workflowRun';

export interface IMockAction extends Omit<MockAction, 'id'>, Document {}

const MockActionSchema = new Schema<IMockAction>({
  executionId: { type: String, required: true, index: true },
  actionId: { type: String, required: true },
  actionType: { type: String, required: true },
  payloadHash: { type: String, required: true },
  executedAt: { type: Date, default: Date.now },
});

// Ensure that a specific action with a specific payload for an execution is only done once
MockActionSchema.index({ executionId: 1, actionId: 1, payloadHash: 1 }, { unique: true });

export const MockActionModel = mongoose.models.MockAction || mongoose.model<IMockAction>('MockAction', MockActionSchema);
