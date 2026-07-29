import mongoose, { Schema, Document } from 'mongoose';
import { Workflow, WorkflowNode, WorkflowEdge } from '../types/workflow';
import { WorkflowStatus, WorkflowStepType } from '../types/common';

export interface IWorkflow extends Omit<Workflow, 'id'>, Document { id: string; }

const PositionSchema = new Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
}, { _id: false });

const WorkflowNodeSchema = new Schema<WorkflowNode>({
  id: { type: String, required: true },
  type: { type: String, enum: Object.values(WorkflowStepType), required: true },
  label: { type: String, required: true },
  configuration: { type: Schema.Types.Mixed, default: {} },
  position: { type: PositionSchema, required: true },
  permissions: [{ type: String }],
}, { _id: false });

const WorkflowEdgeSchema = new Schema<WorkflowEdge>({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  sourceHandle: { type: String },
  targetHandle: { type: String },
  condition: { type: Schema.Types.Mixed },
}, { _id: false });

const WorkflowSchema = new Schema<IWorkflow>({
  name: { type: String, required: true },
  description: { type: String },
  version: { type: Number, default: 1 },
  status: { type: String, enum: Object.values(WorkflowStatus), default: WorkflowStatus.DRAFT },
  nodes: { type: [WorkflowNodeSchema], default: [] },
  edges: { type: [WorkflowEdgeSchema], default: [] },
  createdBy: { type: String, required: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export const WorkflowModel = mongoose.models.Workflow || mongoose.model<IWorkflow>('Workflow', WorkflowSchema);
